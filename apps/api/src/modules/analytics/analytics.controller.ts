import { FastifyRequest, FastifyReply } from 'fastify';
import { getDashboardStats } from './analytics.service.js';

interface AuthUser {
    userId: string;
    restaurantId: string;
}

export const getStats = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const user = request.user as AuthUser;
        const { days } = request.query as { days?: string };

        const stats = await getDashboardStats(user.restaurantId, days ? parseInt(days) : 30);

        reply.send(stats);
    } catch (error) {
        request.log.error(error);
        reply.status(500).send({ message: 'Failed to fetch analytics stats' });
    }
};
