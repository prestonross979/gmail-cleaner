import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { GmailApiError } from "@/lib/gmail/client";
import { SessionError } from "@/lib/auth/session";

/**
 * Converts a caught error into a friendly JSON error response. Never
 * includes token values, request headers, or raw provider payloads.
 */
export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof SessionError) {
    return NextResponse.json({ error: error.message, code: "AUTH_REQUIRED" }, { status: error.status });
  }

  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Invalid request.", code: "INVALID_REQUEST" }, { status: 400 });
  }

  if (error instanceof GmailApiError) {
    if (error.code === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Your Google session has expired. Please sign in again.", code: "AUTH_REQUIRED" },
        { status: 401 },
      );
    }
    if (error.code === "RATE_LIMITED") {
      return NextResponse.json(
        { error: "Gmail is rate-limiting requests right now. Please try again shortly.", code: "RATE_LIMITED" },
        { status: 429 },
      );
    }
    return NextResponse.json({ error: "Gmail API request failed. Please try again.", code: "GMAIL_ERROR" }, { status: 502 });
  }

  return NextResponse.json({ error: "Something went wrong. Please try again.", code: "UNKNOWN" }, { status: 500 });
}
