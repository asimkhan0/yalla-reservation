import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { handleIncomingMessage } from './whatsapp.service';

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
            return reply.status(200).send('OK');
        } catch (error) {
            request.log.error(error);
            return reply.status(200).send('OK'); // Always return 200 to Twilio to prevent retries
        }
    });
}
