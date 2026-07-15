import { NextResponse } from "next/server";
import { requireAccessToken } from "@/lib/auth/session";
import { GMAIL_SCAN_LIMIT, isMockMode } from "@/lib/env";
import { toErrorResponse } from "@/lib/api/errors";
import { getMockScanResult } from "@/lib/gmail/mock";
import { scanMailbox } from "@/lib/gmail/scan";

export async function GET() {
  try {
    if (isMockMode()) {
      return NextResponse.json(getMockScanResult());
    }

    const accessToken = await requireAccessToken();
    const result = await scanMailbox(accessToken, GMAIL_SCAN_LIMIT);
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
