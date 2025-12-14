import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import * as service from './reservations.service.js';
import { createReservationSchema, updateReservationSchema, listReservationsQuerySchema } from './reservations.schema.js';

interface AuthUser {
    userId: string;
    restaurantId: string;
}

export async function reservationRoutes(fastify: FastifyInstance) {
    // GET /api/reservations - List all reservations
    fastify.get('/', {
        schema: {
            tags: ['reservations'],
            description: 'List reservations for the restaurant',
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                properties: {
                    date: { type: 'string', description: 'Filter by date (YYYY-MM-DD)' },
                    startDate: { type: 'string', description: 'Start date for range' },
                    endDate: { type: 'string', description: 'End date for range' },
                    status: { type: 'string', description: 'Filter by status' },
                },
            },
        },
        preHandler: [fastify.authenticate],
    }, async (request, reply) => {
        const user = request.user as AuthUser;
        const query = listReservationsQuerySchema.parse(request.query);
        const reservations = await service.listReservations(user.restaurantId, query);
        return reply.send({ reservations });
    });

    // GET /api/reservations/:id - Get single reservation
    fastify.get('/:id', {
        schema: {
            tags: ['reservations'],
            description: 'Get reservation by ID',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: { id: { type: 'string' } },
            },
        },
        preHandler: [fastify.authenticate],
    }, async (request, reply) => {
        const user = request.user as AuthUser;
        const params = request.params as { id: string };
        const reservation = await service.getReservationById(params.id, user.restaurantId);
        return reply.send(reservation);
    });

    // POST /api/reservations - Create reservation
    fastify.post('/', {
        schema: {
            tags: ['reservations'],
            description: 'Create a new reservation',
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['date', 'time', 'partySize', 'guestName', 'guestPhone'],
                properties: {
                    date: { type: 'string', format: 'date-time' },
                    time: { type: 'string' },
                    partySize: { type: 'integer' },
                    guestName: { type: 'string' },
                    guestPhone: { type: 'string' },
                    guestEmail: { type: 'string' },
                    occasion: { type: 'string' },
                    specialRequests: { type: 'string' },
                    dietaryNotes: { type: 'string' },
                    tableId: { type: 'string' },
                },
            },
        },
        preHandler: [fastify.authenticate],
    }, async (request, reply) => {
        const user = request.user as AuthUser;
        const data = createReservationSchema.parse(request.body);
        const reservation = await service.createReservation(user.restaurantId, data);
        return reply.status(201).send(reservation);
    });

    // PUT /api/reservations/:id - Update reservation
    fastify.put('/:id', {
        schema: {
            tags: ['reservations'],
            description: 'Update a reservation',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: { id: { type: 'string' } },
            },
        },
        preHandler: [fastify.authenticate],
    }, async (request, reply) => {
        const user = request.user as AuthUser;
        const params = request.params as { id: string };
        const data = updateReservationSchema.parse(request.body);
        const reservation = await service.updateReservation(params.id, user.restaurantId, data);
        return reply.send(reservation);
    });

    // DELETE /api/reservations/:id - Delete reservation
    fastify.delete('/:id', {
        schema: {
            tags: ['reservations'],
            description: 'Delete a reservation',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: { id: { type: 'string' } },
            },
        },
        preHandler: [fastify.authenticate],
    }, async (request, reply) => {
        const user = request.user as AuthUser;
        const params = request.params as { id: string };
        await service.deleteReservation(params.id, user.restaurantId);
        return reply.status(204).send();
    });
}
