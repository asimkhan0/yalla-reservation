import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { handleIncomingWebhook, handleTestChat, sendWhatsAppMessage } from './whatsapp.service.js';
import { Restaurant } from '../../models/index.js';

export async function whatsappRoutes(fastify: FastifyInstance) {

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

        console.log(`[Meta Webhook] GET (Verification) request for restaurant: ${restaurantId}`);

        const mode = query['hub.mode'];
        const token = query['hub.verify_token'];
        const challenge = query['hub.challenge'];

        if (mode && token) {
            const restaurant = await Restaurant.findById(restaurantId);
            if (!restaurant) {
                console.warn(`[Meta Webhook] Restaurant ${restaurantId} not found in database`);
                return reply.status(404).send('Restaurant not found');
            }

            const config = restaurant.whatsappConfig;

            if (config && config.provider === 'meta' && config.webhookVerifyToken === token) {
                console.log(`[Meta Webhook] Verification SUCCESS for ${restaurant.name}`);
                return reply.status(200).send(challenge);
            } else {
                console.warn(`[Meta Webhook] Verification FAILED for ${restaurant.name}. Expected token: ${config?.webhookVerifyToken}, received: ${token}`);
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

        console.log(`[Meta Webhook] POST received for restaurant: ${restaurantId}`);
        console.log(`[Meta Webhook] Payload:`, JSON.stringify(body, null, 2));

        try {
            const restaurant = await Restaurant.findById(restaurantId);
            if (!restaurant) {
                console.warn(`[Meta Webhook] Restaurant ${restaurantId} not found in database`);
                return reply.status(404).send('Restaurant not found');
            }

            if (body.object) {
                if (
                    body.entry &&
                    body.entry[0].changes &&
                    body.entry[0].changes[0] &&
                    body.entry[0].changes[0].value.messages &&
                    body.entry[0].changes[0].value.messages[0]
                ) {
                    console.log(`[Meta Webhook] Processing message for ${restaurant.name}`);
                    await handleIncomingWebhook(restaurant, body);
                } else {
                    console.log(`[Meta Webhook] Received non-message event (status/read/etc) for ${restaurant.name}`);
                }
                return reply.status(200).send('EVENT_RECEIVED');
            }

            console.warn(`[Meta Webhook] Invalid payload object:`, body.object);
            return reply.status(404).send();
        } catch (error: any) {
            console.error(`[Meta Webhook] Error processing webhook for ${restaurantId}:`, error.message);
            request.log.error(error);
            return reply.status(200).send('EVENT_RECEIVED');
        }
    });

    // -------------------------------------------------------------------------
    // Test Utility (Simulated)
    // -------------------------------------------------------------------------
    fastify.post('/chat-test', {
        preHandler: [(fastify as any).authenticate],
        schema: {
            tags: ['whatsapp'],
            description: 'Test WhatsApp connection and Agent response logic'
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const user = (request as any).user;
        const body = request.body as any;
        console.log(`[Chat Test] Received Body:`, JSON.stringify(body, null, 2));

        // Use restaurantId from authenticated token for reliability
        const restaurantId = user.restaurantId;
        const { message, phoneNumber } = body;

        try {
            // 1. Send REAL outbound message via configured provider
            await sendWhatsAppMessage(restaurantId, phoneNumber, message);

            // 2. Perform AI simulation (updates DB and returns AI response text)
            const response = await handleTestChat(restaurantId, message, phoneNumber);

            return { success: true, response };
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({
                error: error.message || 'Test failed',
                details: error.response?.data || error.data
            });
        }
    });

    // -------------------------------------------------------------------------
    // Verify Meta Connection (validates credentials and fetches business info)
    // -------------------------------------------------------------------------
    fastify.post('/verify-meta-connection', {
        preHandler: [(fastify as any).authenticate],
        schema: {
            tags: ['whatsapp'],
            description: 'Verify Meta WhatsApp Business API credentials',
            body: {
                type: 'object',
                properties: {
                    phoneNumberId: { type: 'string' },
                    accessToken: { type: 'string' }
                },
                required: ['phoneNumberId', 'accessToken']
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { phoneNumberId, accessToken } = request.body as {
            phoneNumberId: string;
            accessToken: string;
        };

        try {
            // Call Meta Graph API to verify credentials and get phone info
            const response = await fetch(
                `https://graph.facebook.com/v21.0/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating&access_token=${accessToken}`
            );

            if (!response.ok) {
                const errorData = await response.json();
                return reply.status(400).send({
                    valid: false,
                    error: errorData.error?.message || 'Invalid credentials'
                });
            }

            const data = await response.json();

            return {
                valid: true,
                displayPhoneNumber: data.display_phone_number,
                verifiedName: data.verified_name,
                qualityRating: data.quality_rating
            };
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({
                valid: false,
                error: error.message || 'Failed to verify connection'
            });
        }
    });

    // -------------------------------------------------------------------------
    // Embedded Signup Token Exchange
    // URL: /api/whatsapp/embedded-signup/exchange
    // -------------------------------------------------------------------------
    fastify.post('/embedded-signup/exchange', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['whatsapp'],
            description: 'Exchange OAuth code for access token during Meta Embedded Signup',
            body: {
                type: 'object',
                required: ['code', 'wabaId', 'phoneNumberId'],
                properties: {
                    code: { type: 'string' },
                    wabaId: { type: 'string' },
                    phoneNumberId: { type: 'string' }
                }
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { code, wabaId, phoneNumberId } = request.body as {
            code: string;
            wabaId: string;
            phoneNumberId: string;
        };
        const user = request.user as { restaurantId: string };

        try {
            const appId = process.env.META_APP_ID;
            const appSecret = process.env.META_APP_SECRET;

            if (!appId || !appSecret) {
                return reply.status(500).send({
                    success: false,
                    error: 'META_APP_ID or META_APP_SECRET not configured on server'
                });
            }

            // 1. Exchange code for access token
            console.log('[Embedded Signup] Exchanging code for access token...');
            const tokenResponse = await fetch(
                `https://graph.facebook.com/v21.0/oauth/access_token?` +
                `client_id=${appId}&` +
                `client_secret=${appSecret}&` +
                `code=${code}`
            );

            if (!tokenResponse.ok) {
                const errorData = await tokenResponse.json();
                console.error('[Embedded Signup] Token exchange failed:', errorData);
                return reply.status(400).send({
                    success: false,
                    error: errorData.error?.message || 'Failed to exchange code for token'
                });
            }

            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.access_token;
            console.log('[Embedded Signup] Access token obtained successfully');

            // 2. Get phone number details
            console.log('[Embedded Signup] Fetching phone number details...');
            const phoneInfoResponse = await fetch(
                `https://graph.facebook.com/v21.0/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating&access_token=${accessToken}`
            );

            if (!phoneInfoResponse.ok) {
                const errorData = await phoneInfoResponse.json();
                console.error('[Embedded Signup] Failed to fetch phone info:', errorData);
                return reply.status(400).send({
                    success: false,
                    error: errorData.error?.message || 'Failed to fetch phone number details'
                });
            }

            const phoneInfo = await phoneInfoResponse.json();
            console.log('[Embedded Signup] Phone info:', phoneInfo);

            // 3. Register phone number for Cloud API messaging
            console.log('[Embedded Signup] Registering phone for Cloud API...');
            const registerResponse = await fetch(
                `https://graph.facebook.com/v21.0/${phoneNumberId}/register?access_token=${accessToken}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messaging_product: 'whatsapp',
                        pin: '123456' // Default 6-digit PIN for 2FA
                    })
                }
            );

            if (!registerResponse.ok) {
                const errorData = await registerResponse.json();
                // Error code 100 means already registered, which is fine
                if (errorData.error?.code !== 100) {
                    console.warn('[Embedded Signup] Phone registration warning:', errorData);
                    // Don't fail - phone might already be registered
                }
            } else {
                console.log('[Embedded Signup] Phone registered for Cloud API');
            }

            // 4. Subscribe app to WABA webhooks
            console.log('[Embedded Signup] Subscribing to WABA webhooks...');
            const subscribeResponse = await fetch(
                `https://graph.facebook.com/v21.0/${wabaId}/subscribed_apps?access_token=${accessToken}`,
                { method: 'POST' }
            );

            if (!subscribeResponse.ok) {
                const errorData = await subscribeResponse.json();
                console.warn('[Embedded Signup] Webhook subscription warning:', errorData);
                // Don't fail - we can configure webhooks manually later
            } else {
                console.log('[Embedded Signup] Subscribed to WABA webhooks');
            }

            // 5. Generate verify token for webhook configuration
            const webhookVerifyToken = Math.random().toString(36).substring(2, 15);

            // 6. Update restaurant configuration
            const restaurant = await Restaurant.findByIdAndUpdate(
                user.restaurantId,
                {
                    whatsappConfig: {
                        enabled: true,
                        provider: 'meta',
                        phoneNumberId,
                        wabaId,
                        accessToken,
                        webhookVerifyToken,
                        businessName: phoneInfo.verified_name || 'Your Business',
                        displayPhoneNumber: phoneInfo.display_phone_number
                    }
                },
                { new: true }
            );

            if (!restaurant) {
                return reply.status(404).send({
                    success: false,
                    error: 'Restaurant not found'
                });
            }

            console.log(`[Embedded Signup] Configuration saved for ${restaurant.name}`);

            return {
                success: true,
                businessName: phoneInfo.verified_name || 'Your Business',
                displayPhoneNumber: phoneInfo.display_phone_number,
                qualityRating: phoneInfo.quality_rating,
                webhookVerifyToken
            };
        } catch (error: any) {
            console.error('[Embedded Signup] Error:', error);
            request.log.error(error);
            return reply.status(500).send({
                success: false,
                error: error.message || 'Internal server error during embedded signup'
            });
        }
    });
}

