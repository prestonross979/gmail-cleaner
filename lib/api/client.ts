import type { ScanResult, SenderActionResponse, SenderPreviewItem } from "@/types/gmail";

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "Something went wrong. Please try again.";
    let code: string | undefined;
    try {
      const body = (await response.json()) as { error?: string; code?: string };
      if (body.error) message = body.error;
      code = body.code;
    } catch {
      // Non-JSON error body; keep the default message.
    }
    throw new ApiError(message, response.status, code);
  }
  return (await response.json()) as T;
}

export async function fetchScan(): Promise<ScanResult> {
  const response = await fetch("/api/scan", { method: "GET" });
  return parseJsonOrThrow<ScanResult>(response);
}

export async function fetchSenderPreview(email: string, messageIds: string[]): Promise<SenderPreviewItem[]> {
  const response = await fetch("/api/senders/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, messageIds }),
  });
  const data = await parseJsonOrThrow<{ items: SenderPreviewItem[] }>(response);
  return data.items;
}

export async function postSenderAction(
  action: "archive" | "trash",
  senders: { email: string; messageIds: string[] }[],
): Promise<SenderActionResponse> {
  const response = await fetch("/api/senders/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, senders }),
  });
  return parseJsonOrThrow<SenderActionResponse>(response);
}
