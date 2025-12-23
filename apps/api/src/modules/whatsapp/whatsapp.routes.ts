import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { handleIncomingWebhook, handleTestChat, handleIncomingMessage } from './whatsapp.service.js';
import { Restaurant } from '../../models/index.js';

export async function whatsappRoutes(fastify: FastifyInstance) {

    // -------------------------------------------------------------------------
    // LEGACY: Original Webhook (Uses ENV variables for Twilio)
    // URL: /api/whatsapp/webhook
    // This is kept for backward compatibility with existing Twilio setup
    // -------------------------------------------------------------------------
    fastify.post('/webhook', {
        schema: {
            tags: ['whatsapp'],
            description: 'Legacy Twilio WhatsApp Webhook (uses ENV config)',
            body: {
                type: 'object',
                properties: {
                    Body: { type: 'string' },
                    From: { type: 'string' },
                    To: { type: 'string' },
                    WaId: { type: 'string' },
                    ProfileName: { type: 'string' }
                },
                additionalProperties: true
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const body = request.body as any;

        console.log('Legacy Webhook received:', {
            body: body.Body,
            from: body.From,
            profile: body.ProfileName
        });

        try {
            await handleIncomingMessage(body);
            return reply.status(200).send('');
        } catch (error) {
            request.log.error(error);
            return reply.status(200).send(''); // Return 200 to prevent Twilio retries
        }
    });

    // -------------------------------------------------------------------------
    // Twilio Webhook
    // URL: /api/whatsapp/webhooks/twilio/:restaurantId
    // -------------------------------------------------------------------------
    fastify.post('/webhooks/twilio/:restaurantId', {
        schema: {
            tags: ['whatsapp'],
            description: 'Twilio WhatsApp Webhook',
            params: {
                type: 'object',
                properties: {
                    restaurantId: { type: 'string' }
                }
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { restaurantId } = request.params as { restaurantId: string };
        const body = request.body as any;

        try {
            const restaurant = await Restaurant.findById(restaurantId);
            if (!restaurant) {
                return reply.status(404).send('Restaurant not found');
            }

            console.log(`[Twilio Webhook] Received for ${restaurant.name}`);
            await handleIncomingWebhook(restaurant, body);

            return reply.status(200).send('');
        } catch (error) {
            request.log.error(error);
            return reply.status(200).send(''); // Return 200 to acknowledge receipt even if error
        }
    });

    // -------------------------------------------------------------------------
    // Meta Cloud API Webhooks
    // URL: /api/whatsapp/webhooks/meta/:restaurantId
    // -------------------------------------------------------------------------

    // 1. Verification Endpoint (GET)
    fastify.get('/webhooks/meta/:restaurantId', {
        schema: {
            tags: ['whatsapp'],
            description: 'Meta Webhook Verification'
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { restaurantId } = request.params as { restaurantId: string };
        const query = request.query as any;

        const mode = query['hub.mode'];
        const token = query['hub.verify_token'];
        const challenge = query['hub.challenge'];

        if (mode && token) {
            const restaurant = await Restaurant.findById(restaurantId);
            if (!restaurant) return reply.status(404).send('Restaurant not found');

            // Allow simplified check or strict check
            const config = restaurant.whatsappConfig;

            // Check if provider is meta and token matches
            // We use 'as any' safely because we check the provider type or just check property existence
            if (config && config.provider === 'meta' && config.webhookVerifyToken === token) {
                console.log(`[Meta Webhook] Verified for ${restaurant.name}`);
                return reply.status(200).send(challenge);
            } else {
                return reply.status(403).send('Verification failed');
            }
        }

        return reply.status(400).send('Bad Request');
    });

    // 2. Event Notification Endpoint (POST)
    fastify.post('/webhooks/meta/:restaurantId', {
        schema: {
            tags: ['whatsapp'],
            description: 'Meta WhatsApp Event Webhook'
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { restaurantId } = request.params as { restaurantId: string };
        const body = request.body as any;

        try {
            const restaurant = await Restaurant.findById(restaurantId);
            if (!restaurant) return reply.status(404).send('Restaurant not found');

            // Handle standard event
            if (body.object) { // Meta payloads usually start with { object: 'whatsapp_business_account', ... }
                // Check if it's a validation ping or actual message
                if (
                    body.entry &&
                    body.entry[0].changes &&
                    body.entry[0].changes[0] &&
                    body.entry[0].changes[0].value.messages &&
                    body.entry[0].changes[0].value.messages[0]
                ) {
                    await handleIncomingWebhook(restaurant, body);
                } else {
                    // Status update or other event (sent, delivered, read)
                    // We can implement status handling later
                    console.log(`[Meta Webhook] Received non-message event for ${restaurant.name}`);
                }
                return reply.status(200).send('EVENT_RECEIVED');
            }

            return reply.status(404).send();
        } catch (error) {
            request.log.error(error);
            return reply.status(200).send('EVENT_RECEIVED');
        }
    });

    // -------------------------------------------------------------------------
    // Test Utility (Simulated)
    // -------------------------------------------------------------------------
    fastify.post('/chat-test', {
        schema: {
            tags: ['whatsapp'],
            description: 'Directly test Agent response logic'
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { message, phoneNumber } = request.body as { message: string, phoneNumber?: string };
        try {
            const response = await handleTestChat(message, phoneNumber);
            return { response };
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({ error: error.message });
        }
    });
}

