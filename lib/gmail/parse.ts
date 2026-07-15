import type { ParsedSender, UnsubscribeInfo } from "@/types/gmail";

/**
 * Decodes RFC 2047 MIME encoded-words (e.g. "=?UTF-8?B?...?=") that Gmail
 * commonly leaves in From display names for non-ASCII senders.
 */
export function decodeMimeWords(input: string): string {
  const encodedWordPattern = /=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g;
  return input.replace(encodedWordPattern, (_match, charset: string, encoding: string, text: string) => {
    try {
      if (encoding.toUpperCase() === "B") {
        const bytes = Buffer.from(text, "base64");
        return new TextDecoder(charset.toLowerCase()).decode(bytes);
      }
      // Quoted-printable style (Q encoding): underscores are spaces, =XX is hex byte.
      const withSpaces = text.replace(/_/g, " ");
      const bytes: number[] = [];
      for (let i = 0; i < withSpaces.length; i++) {
        if (withSpaces[i] === "=" && i + 2 < withSpaces.length) {
          bytes.push(Number.parseInt(withSpaces.slice(i + 1, i + 3), 16));
          i += 2;
        } else {
          bytes.push(withSpaces.charCodeAt(i));
        }
      }
      return new TextDecoder(charset.toLowerCase()).decode(Uint8Array.from(bytes));
    } catch {
      return text;
    }
  });
}

/**
 * Parses an RFC 5322 "From" header into a display name and email address.
 * Handles the common shapes Gmail returns:
 *   "Display Name" <email@example.com>
 *   Display Name <email@example.com>
 *   email@example.com
 */
export function parseFromHeader(raw: string | null | undefined): ParsedSender {
  if (!raw) return { name: "", email: "" };
  const decoded = decodeMimeWords(raw.trim());

  const angleBracketMatch = decoded.match(/^(.*)<\s*([^<>\s]+@[^<>\s]+)\s*>\s*$/);
  if (angleBracketMatch) {
    const namePart = angleBracketMatch[1].trim().replace(/^"(.*)"$/, "$1").trim();
    const email = angleBracketMatch[2].trim();
    return { name: namePart, email: normalizeSenderEmail(email) };
  }

  const bareEmailMatch = decoded.match(/^[^\s<>]+@[^\s<>]+$/);
  if (bareEmailMatch) {
    return { name: "", email: normalizeSenderEmail(decoded) };
  }

  // Fallback: try to find any email-looking substring.
  const anyEmail = decoded.match(/[^\s<>]+@[^\s<>]+/);
  if (anyEmail) {
    const name = decoded.replace(anyEmail[0], "").replace(/[<>"]/g, "").trim();
    return { name, email: normalizeSenderEmail(anyEmail[0]) };
  }

  return { name: decoded, email: "" };
}

/** Lowercases and trims an email address for stable grouping/deduping. */
export function normalizeSenderEmail(email: string): string {
  return email.trim().toLowerCase().replace(/[.,;]+$/, "");
}

/** Extracts the domain portion of a normalized email address. */
export function extractDomain(email: string): string {
  const at = email.lastIndexOf("@");
  if (at === -1 || at === email.length - 1) return "";
  return email.slice(at + 1);
}

const SAFE_URL_PROTOCOLS = new Set(["http:", "https:"]);

export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return SAFE_URL_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
}

export function isSafeMailto(value: string): boolean {
  return /^mailto:[^\s<>]+@[^\s<>]+/i.test(value.trim());
}

/**
 * Parses the List-Unsubscribe (and optional List-Unsubscribe-Post) headers
 * per RFC 2369 / RFC 8058. Only well-formed http(s) and mailto targets are
 * returned; anything else is ignored rather than surfaced to the UI.
 */
export function parseListUnsubscribe(
  listUnsubscribe: string | null | undefined,
  listUnsubscribePost: string | null | undefined,
): UnsubscribeInfo | undefined {
  if (!listUnsubscribe) return undefined;

  const targets = [...listUnsubscribe.matchAll(/<([^>]+)>/g)].map((m) => m[1].trim());
  // Some senders omit angle brackets and send a single bare URL.
  if (targets.length === 0 && listUnsubscribe.trim()) {
    targets.push(listUnsubscribe.trim());
  }

  let httpUrl: string | undefined;
  let mailto: string | undefined;

  for (const target of targets) {
    if (!httpUrl && isSafeHttpUrl(target)) {
      httpUrl = target;
    } else if (!mailto && isSafeMailto(target)) {
      mailto = target;
    }
  }

  if (!httpUrl && !mailto) return undefined;

  const oneClick = Boolean(listUnsubscribePost && /one-click/i.test(listUnsubscribePost));

  return { httpUrl, mailto, oneClick };
}
