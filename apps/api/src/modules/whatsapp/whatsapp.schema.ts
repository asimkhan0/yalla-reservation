import { z } from 'zod';

export const webhookSchema = z.object({
    SmsMessageSid: z.string(),
    NumMedia: z.string(),
    ProfileName: z.string().optional(),
    SmsSid: z.string(),
    WaId: z.string(),
    SmsStatus: z.string(),
    Body: z.string(),
    To: z.string(),
    NumSegments: z.string(),
    ReferralNumMedia: z.string().optional(),
    MessageSid: z.string(),
    AccountSid: z.string(),
    From: z.string(),
    ApiVersion: z.string(),
});

export type WebhookBody = z.infer<typeof webhookSchema>;
