import { NextResponse } from "next/server";
import { requireAccessToken } from "@/lib/auth/session";
import { isMockMode, SENDER_PREVIEW_COUNT } from "@/lib/env";
import { toErrorResponse } from "@/lib/api/errors";
import { getMockPreview } from "@/lib/gmail/mock";
import { fetchSenderPreview } from "@/lib/gmail/preview";
import { senderPreviewRequestSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const body = senderPreviewRequestSchema.parse(await request.json());
    const previewIds = body.messageIds.slice(0, SENDER_PREVIEW_COUNT);

    if (isMockMode()) {
      return NextResponse.json({ items: getMockPreview(body.email, previewIds) });
    }

    const accessToken = await requireAccessToken();
    const items = await fetchSenderPreview(accessToken, previewIds);
    return NextResponse.json({ items });
  } catch (error) {
    return toErrorResponse(error);
  }
}
