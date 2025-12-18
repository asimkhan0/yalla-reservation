import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { handleIncomingMessage, handleTestChat } from './whatsapp.service.js';

export async function whatsappRoutes(fastify: FastifyInstance) {
    // Webhook for Twilio
    fastify.post('/webhook', {
        schema: {
            tags: ['whatsapp'],
            description: 'Twilio WhatsApp Webhook',
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
        // Twilio sends data as form-urlencoded, Fastify parses it into body
        // We process it asynchronously to return 200 OK quickly to Twilio
        const body = request.body as any;

        // Log incoming message
        console.log('Main Webhook received:', {
            body: body.Body,
            from: body.From,
            profile: body.ProfileName
        });

        try {
            await handleIncomingMessage(body);
            return reply.status(200).send(''); // Returning empty body is standard for Twilio to do nothing
        } catch (error) {
            request.log.error(error);
            return reply.status(200).send(''); // Always return 200 to Twilio to prevent retries
        }
    });

    // Test endpoint for Agent (Direct API)
    fastify.post('/chat-test', {
        schema: {
            tags: ['whatsapp'],
            description: 'Directly test Agent response logic without Twilio',
            body: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    phoneNumber: { type: 'string' }
                },
                required: ['message']
            }
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
