import { FastifyInstance } from 'fastify';
import { updateRestaurantSchema } from './restaurants.schema.js';
import { getRestaurant, updateRestaurant } from './restaurants.service.js';

export async function restaurantRoutes(fastify: FastifyInstance) {
    fastify.get('/me', {
        preHandler: [fastify.authenticate],
    }, async (request) => {
        const user = request.user as any;
        return getRestaurant(user.restaurantId);
    });

    fastify.patch('/me', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['restaurants'],
            body: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    whatsappNumber: { type: 'string' },
                    whatsappEnabled: { type: 'boolean' },
                    address: { type: 'string' },
                    phone: { type: 'string' },
                    website: { type: 'string' },
                },
            },
        },
    }, async (request) => {
        const user = request.user as any;
        const body = updateRestaurantSchema.parse(request.body);
        return updateRestaurant(user.restaurantId, body);
    });
}
