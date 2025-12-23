import { IWhatsAppProvider, IncomingMessageData } from './whatsapp.provider.interface.js';
import axios from 'axios';

interface MetaConfig {
    phoneNumberId: string;
    accessToken: string;
}

export class MetaProvider implements IWhatsAppProvider {
    private phoneNumberId: string;
    private accessToken: string;
    private baseUrl = 'https://graph.facebook.com/v21.0'; // Updated to recent version

    constructor(config: MetaConfig) {
        this.phoneNumberId = config.phoneNumberId;
        this.accessToken = config.accessToken;
    }

    async sendText(to: string, body: string): Promise<void> {
        try {
            await axios.post(
                `${this.baseUrl}/${this.phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: to,
                    type: 'text',
                    text: { preview_url: false, body: body }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log(`[MetaProvider] Sent to ${to}`);
        } catch (error: any) {
            console.error('[MetaProvider] Send Error:', error.response?.data || error.message);
            throw new Error(`Meta Send Error: ${JSON.stringify(error.response?.data || error.message)}`);
        }
    }

    async sendTemplate(to: string, template: string, components: any[]): Promise<void> {
        try {
            await axios.post(
                `${this.baseUrl}/${this.phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    to: to,
                    type: 'template',
                    template: {
                        name: template,
                        language: { code: 'en_US' }, // make dynamic if needed
                        components: components
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
        } catch (error: any) {
            console.error('[MetaProvider] Template Error:', error.response?.data || error.message);
            throw new Error(`Meta Template Error: ${JSON.stringify(error.response?.data || error.message)}`);
        }
    }

    async validateWebhook(headers: any, body: any, secret: string): Promise<boolean> {
        // Meta sends 'X-Hub-Signature-256'
        // We can validate using crypto hmac
        // For now, simple check.
        // Also used for verify_token challenge but that's a GET request, usually handled separately.

        // logic:
        // const signature = headers['x-hub-signature-256'];
        // const hash = 'sha256=' + crypto.createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex');
        // return signature === hash;

        return true; // Placeholder for strict validation
    }

    parseWebhookPayload(body: any): IncomingMessageData {
        // Meta Cloud API Webhook structure
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];
        const contact = value?.contacts?.[0];

        if (!message) {
            throw new Error('No message found in Meta webhook payload');
        }

        return {
            from: message.from,
            to: value.metadata?.display_phone_number || value.metadata?.phone_number_id,
            body: message.text?.body || '', // Handle different types (image, button) if needed
            messageId: message.id,
            profileName: contact?.profile?.name,
            timestamp: new Date(parseInt(message.timestamp) * 1000)
        };
    }
}
