const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1";

export class GmailApiError extends Error {
  status: number;
  code: "UNAUTHORIZED" | "RATE_LIMITED" | "NOT_FOUND" | "SERVER_ERROR" | "UNKNOWN";

  constructor(message: string, status: number, code: GmailApiError["code"]) {
    super(message);
    this.name = "GmailApiError";
    this.status = status;
    this.code = code;
  }
}

function classifyStatus(status: number): GmailApiError["code"] {
  if (status === 401) return "UNAUTHORIZED";
  if (status === 429) return "RATE_LIMITED";
  if (status === 404) return "NOT_FOUND";
  if (status >= 500) return "SERVER_ERROR";
  return "UNKNOWN";
}

interface FetchWithRetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
}

/**
 * Fetches a Gmail API endpoint, retrying on 429 (rate limit) and 5xx
 * (transient server error) responses with exponential backoff. Honors a
 * numeric Retry-After header when present. Never logs the access token.
 */
async function gmailFetch(
  accessToken: string,
  path: string,
  init: RequestInit = {},
  { maxRetries = 4, baseDelayMs = 500 }: FetchWithRetryOptions = {},
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${GMAIL_API_BASE}${path}`;

  let attempt = 0;
  for (;;) {
    const response = await fetch(url, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (response.ok) return response;

    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt >= maxRetries) {
      const code = classifyStatus(response.status);
      let detail = "";
      try {
        const body = (await response.json()) as { error?: { message?: string } };
        detail = body.error?.message ?? "";
      } catch {
        // Response body wasn't JSON; ignore.
      }
      throw new GmailApiError(detail || `Gmail API request failed with status ${response.status}`, response.status, code);
    }

    const retryAfterHeader = response.headers.get("Retry-After");
    const retryAfterMs = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) * 1000 : NaN;
    const backoffMs = Number.isFinite(retryAfterMs) ? retryAfterMs : baseDelayMs * 2 ** attempt;
    const jitterMs = Math.random() * 100;
    await new Promise((resolve) => setTimeout(resolve, backoffMs + jitterMs));
    attempt++;
  }
}

export async function gmailGet<T>(accessToken: string, path: string, options?: FetchWithRetryOptions): Promise<T> {
  const response = await gmailFetch(accessToken, path, { method: "GET" }, options);
  return (await response.json()) as T;
}

export async function gmailPost<T>(
  accessToken: string,
  path: string,
  body: unknown,
  options?: FetchWithRetryOptions,
): Promise<T | undefined> {
  const response = await gmailFetch(
    accessToken,
    path,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    options,
  );
  if (response.status === 204) return undefined;
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : undefined;
}
