import { z } from "zod";

export const senderPreviewRequestSchema = z.object({
  email: z.string().trim().email(),
  messageIds: z.array(z.string().min(1)).min(1).max(2000),
});

export type SenderPreviewRequest = z.infer<typeof senderPreviewRequestSchema>;

export const senderActionRequestSchema = z.object({
  action: z.enum(["archive", "trash"]),
  senders: z
    .array(
      z.object({
        email: z.string().trim().email(),
        messageIds: z.array(z.string().min(1)).min(1).max(5000),
      }),
    )
    .min(1)
    .max(500),
});

export type SenderActionRequest = z.infer<typeof senderActionRequestSchema>;
