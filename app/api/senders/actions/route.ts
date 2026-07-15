import { NextResponse } from "next/server";
import type { SenderActionResponse, SenderActionResultItem } from "@/types/gmail";
import { requireAccessToken } from "@/lib/auth/session";
import { isMockMode } from "@/lib/env";
import { toErrorResponse } from "@/lib/api/errors";
import { mockArchive, mockTrash } from "@/lib/gmail/mock";
import { archiveMessages, trashMessages } from "@/lib/gmail/actions";
import { senderActionRequestSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const body = senderActionRequestSchema.parse(await request.json());
    const mock = isMockMode();
    const accessToken = mock ? null : await requireAccessToken();

    const results: SenderActionResultItem[] = [];

    for (const sender of body.senders) {
      if (mock) {
        const outcome =
          body.action === "archive" ? mockArchive(sender.email, sender.messageIds) : mockTrash(sender.email, sender.messageIds);
        results.push({ email: sender.email, ...outcome });
        continue;
      }

      const outcome =
        body.action === "archive"
          ? await archiveMessages(accessToken as string, sender.messageIds)
          : await trashMessages(accessToken as string, sender.messageIds);
      results.push({
        email: sender.email,
        requested: outcome.requested,
        succeeded: outcome.succeeded,
        failed: outcome.failed,
        errorMessage: outcome.errorMessage,
      });
    }

    const response: SenderActionResponse = { action: body.action, results };
    return NextResponse.json(response);
  } catch (error) {
    return toErrorResponse(error);
  }
}
