import { FastifyInstance } from 'fastify';
import { getStats } from './analytics.controller.js';

export async function analyticsRoutes(fastify: FastifyInstance) {
    fastify.get('/stats', {
        preHandler: [fastify.authenticate]
    }, getStats);
}
