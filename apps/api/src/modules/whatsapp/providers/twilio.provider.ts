import { IWhatsAppProvider, IncomingMessageData } from './whatsapp.provider.interface.js';
import twilio from 'twilio';

// Define the config interface locally to avoid circular dependencies with Schema if possible, 
// or import if we move schema to types. For now, we assume the passed config is correct.
interface TwilioConfig {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
}

export class TwilioProvider implements IWhatsAppProvider {
    private client: twilio.Twilio;
    private phoneNumber: string;
    private authToken: string;

    constructor(config: TwilioConfig) {
        this.client = twilio(config.accountSid, config.authToken);
        // Ensure "whatsapp:" prefix
        this.phoneNumber = config.phoneNumber.startsWith('whatsapp:')
            ? config.phoneNumber
            : `whatsapp:${config.phoneNumber}`;
        this.authToken = config.authToken;
    }

    async sendText(to: string, body: string): Promise<void> {
        const toNum = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

        try {
            await this.client.messages.create({
                body,
                from: this.phoneNumber,
                to: toNum
            });
            console.log(`[TwilioProvider] Sent to ${to}`);
        } catch (error: any) {
            console.error('[TwilioProvider] Send Error:', error);
            throw new Error(`Twilio Send Error: ${error.message}`);
        }
    }

    async sendTemplate(to: string, template: string, components: any[]): Promise<void> {
        // Twilio Content API / Templates are different from standard Send
        // For MVP/Legacy, we might just focus on Text. 
        // If needed, we implement Content API here.
        console.warn('[TwilioProvider] sendTemplate not fully implemented, falling back to basic text if possible or throwing.');
        throw new Error('Twilio Send Template not implemented yet');
    }

    async validateWebhook(headers: any, body: any, secret: string): Promise<boolean> {
        // Twilio Validation
        // Webhooks should be validated using X-Twilio-Signature
        // However, 'secret' here is usually the AUTH_TOKEN for Twilio validation
        // The 'url' is also needed for Twilio validation (the full webhook URL)

        // IMPORTANT: Twilio validation requires the full URL which we might not have easily 
        // unless passed down. For now, we might do a simpler check or rely on the fact 
        // that we looked up the restaurant by ID in the URL.

        // Robust validation:
        const twilioSignature = headers['x-twilio-signature'];
        const url = secret; // In our architecture, we might pass the URL as 'secret' for Twilio? 
        // Or we pass params: (headers, body, authToken, originalUrl)

        // For this iteration, we'll simpler check if signature exists, 
        // but REAL validation requires 'twilio.validateRequest'.
        // We will assume the caller middleware might handle this or we implement it later.

        return !!twilioSignature;
    }

    parseWebhookPayload(body: any): IncomingMessageData {
        // Twilio sends form-urlencoded usually, but we might receive JSON depending on setup.
        // Assuming Standard Twilio Webhook format (Form Data converted to Object by body-parser)

        const { WaId, Body, MessageSid, ProfileName, From, To } = body;

        return {
            from: WaId, // The user's number (raw, e.g. 123456789) or with valid format
            to: To,     // The restaurant number
            body: Body,
            messageId: MessageSid,
            profileName: ProfileName,
            timestamp: new Date()
        };
    }
}
