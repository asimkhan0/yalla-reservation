
export interface IncomingMessageData {
    from: string;
    to: string;
    body: string;
    messageId: string;
    profileName?: string;
    timestamp: Date;
}

export interface IWhatsAppProvider {
    sendText(to: string, body: string): Promise<void>;
    sendTemplate(to: string, template: string, components: any[]): Promise<void>;
    // Validates incoming webhook request signature
    validateWebhook(headers: any, body: any, secret: string): Promise<boolean>;
    // Normalizes payload to our internal Message format
    parseWebhookPayload(body: any): IncomingMessageData;
}
