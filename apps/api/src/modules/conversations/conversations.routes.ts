import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as service from './conversations.service.js';

export async function conversationRoutes(fastify: FastifyInstance) {
    // List Conversations
    fastify.get(
        '/',
        {
            schema: {
                tags: ['conversations'],
                description: 'List active conversations',
                security: [{ bearerAuth: [] }],
            },
            preHandler: fastify.authenticate,
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as { restaurantId: string };
            const conversations = await service.listConversations(user.restaurantId);
            return reply.send({ conversations });
        }
    );

    // Get Messages
    fastify.get(
        '/:id/messages',
        {
            schema: {
                tags: ['conversations'],
                description: 'Get messages for a conversation',
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' }
                    }
                }
            },
            preHandler: fastify.authenticate,
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const { id } = request.params as { id: string };
            const messages = await service.getConversationMessages(id);
            return reply.send({ messages });
        }
    );

    // Assign Conversation
    fastify.patch(
        '/:id/assign',
        {
            schema: {
                tags: ['conversations'],
                description: 'Assign conversation to BOT or AGENT',
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' }
                    }
                },
                body: {
                    type: 'object',
                    required: ['assignedTo'],
                    properties: {
                        assignedTo: { type: 'string', enum: ['BOT', 'AGENT'] }
                    }
                }
            },
            preHandler: fastify.authenticate,
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const { id } = request.params as { id: string };
            const { assignedTo } = request.body as { assignedTo: 'BOT' | 'AGENT' };
            const conversation = await service.assignConversation(id, assignedTo);
            return reply.send({ conversation });
        }
    );
}
