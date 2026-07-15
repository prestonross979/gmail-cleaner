import { describe, expect, it } from "vitest";
import { extractDomain, normalizeSenderEmail, parseFromHeader, parseListUnsubscribe } from "./parse";

describe("parseFromHeader", () => {
  it("parses a quoted display name with angle-bracket email", () => {
    expect(parseFromHeader('"LinkedIn" <notifications@linkedin.com>')).toEqual({
      name: "LinkedIn",
      email: "notifications@linkedin.com",
    });
  });

  it("parses an unquoted display name with angle-bracket email", () => {
    expect(parseFromHeader("Amazon.com <order-update@amazon.com>")).toEqual({
      name: "Amazon.com",
      email: "order-update@amazon.com",
    });
  });

  it("parses a bare email address with no display name", () => {
    expect(parseFromHeader("noreply@medium.com")).toEqual({
      name: "",
      email: "noreply@medium.com",
    });
  });

  it("normalizes email case and whitespace", () => {
    expect(parseFromHeader("Someone <  Someone@Example.COM  >")).toEqual({
      name: "Someone",
      email: "someone@example.com",
    });
  });

  it("decodes RFC 2047 base64-encoded display names", () => {
    // "Café" UTF-8 base64-encoded
    const encoded = "=?UTF-8?B?Q2Fmw6k=?=";
    const result = parseFromHeader(`${encoded} <hello@example.com>`);
    expect(result.email).toBe("hello@example.com");
    expect(result.name).toBe("Café");
  });

  it("returns empty fields for null/undefined input", () => {
    expect(parseFromHeader(null)).toEqual({ name: "", email: "" });
    expect(parseFromHeader(undefined)).toEqual({ name: "", email: "" });
  });

  it("falls back to extracting an email substring from malformed headers", () => {
    const result = parseFromHeader("Weird Format notifications@github.com trailing text");
    expect(result.email).toBe("notifications@github.com");
  });
});

describe("normalizeSenderEmail", () => {
  it("lowercases and trims", () => {
    expect(normalizeSenderEmail("  Foo@Bar.COM  ")).toBe("foo@bar.com");
  });

  it("strips trailing punctuation", () => {
    expect(normalizeSenderEmail("foo@bar.com,")).toBe("foo@bar.com");
    expect(normalizeSenderEmail("foo@bar.com.")).toBe("foo@bar.com");
  });

  it("treats differently-cased addresses as identical after normalization", () => {
    expect(normalizeSenderEmail("Notifications@LinkedIn.com")).toBe(normalizeSenderEmail("notifications@linkedin.com"));
  });
});

describe("extractDomain", () => {
  it("extracts the domain from a normalized email", () => {
    expect(extractDomain("notifications@linkedin.com")).toBe("linkedin.com");
  });

  it("returns an empty string when there is no @ or a trailing @", () => {
    expect(extractDomain("not-an-email")).toBe("");
    expect(extractDomain("foo@")).toBe("");
  });
});

describe("parseListUnsubscribe", () => {
  it("parses both an https url and a mailto target", () => {
    const result = parseListUnsubscribe(
      "<https://example.com/unsubscribe?id=123>, <mailto:unsub@example.com>",
      undefined,
    );
    expect(result).toEqual({
      httpUrl: "https://example.com/unsubscribe?id=123",
      mailto: "mailto:unsub@example.com",
      oneClick: false,
    });
  });

  it("detects RFC 8058 one-click support from List-Unsubscribe-Post", () => {
    const result = parseListUnsubscribe("<https://example.com/unsubscribe>", "List-Unsubscribe=One-Click");
    expect(result?.oneClick).toBe(true);
  });

  it("ignores unsafe protocols like javascript:", () => {
    const result = parseListUnsubscribe("<javascript:alert(1)>", undefined);
    expect(result).toBeUndefined();
  });

  it("handles a bare URL with no angle brackets", () => {
    const result = parseListUnsubscribe("https://example.com/unsubscribe", undefined);
    expect(result?.httpUrl).toBe("https://example.com/unsubscribe");
  });

  it("returns undefined when the header is missing", () => {
    expect(parseListUnsubscribe(undefined, undefined)).toBeUndefined();
    expect(parseListUnsubscribe(null, undefined)).toBeUndefined();
  });

  it("returns undefined when the header has no valid targets", () => {
    expect(parseListUnsubscribe("<ftp://example.com/unsub>", undefined)).toBeUndefined();
  });
});
