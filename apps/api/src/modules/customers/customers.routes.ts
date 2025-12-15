import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as service from './customers.service.js';

export async function customerRoutes(fastify: FastifyInstance) {
    fastify.get(
        '/',
        {
            schema: {
                tags: ['customers'],
                description: 'List customers',
                security: [{ bearerAuth: [] }],
                querystring: {
                    type: 'object',
                    properties: {
                        page: { type: 'integer', minimum: 1 },
                        limit: { type: 'integer', minimum: 1, maximum: 100 },
                        search: { type: 'string' }
                    }
                }
            },
            preHandler: fastify.authenticate,
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as { restaurantId: string };
            const query = request.query as { page?: number; limit?: number; search?: string };
            const result = await service.listCustomers(user.restaurantId, query);
            return reply.send(result);
        }
    );
}
