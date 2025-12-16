import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import formbody from '@fastify/formbody';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { authRoutes } from './modules/auth/index.js';
import { reservationRoutes } from './modules/reservations/index.js';
import { conversationRoutes } from './modules/conversations/index.js';
import { customerRoutes } from './modules/customers/index.js';
import { restaurantRoutes } from './modules/restaurants/index.js';
import { whatsappRoutes } from './modules/whatsapp/index.js';
import { uploadRoutes } from './modules/uploads/uploads.routes.js';

const __filename = fileURLToPath(import.meta.url);

export async function buildApp() {
    // Initialize Fastify
    const fastify = Fastify({
        logger: {
            transport:
                env.NODE_ENV === 'development'
                    ? {
                        target: 'pino-pretty',
                        options: { colorize: true },
                    }
                    : undefined,
        },
    });

    // Register plugins
    await fastify.register(cors, { origin: env.CORS_ORIGIN, credentials: true });
    await fastify.register(formbody);
    await fastify.register(jwt, { secret: env.JWT_SECRET });

    // Decorator for authenticated user
    fastify.decorate('authenticate', async function (request: any, reply: any) {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.status(401).send({ error: 'Unauthorized' });
        }
    });

    await fastify.register(swagger, {
        openapi: {
            info: {
                title: 'Yalla Reservation API',
                description: 'REST API for restaurant reservation system with WhatsApp bot integration',
                version: '0.1.0',
            },
            servers: [
                {
                    url: `http://localhost:${env.PORT}`,
                    description: 'Development server',
                },
            ],
            tags: [
                { name: 'auth', description: 'Authentication endpoints' },
                { name: 'restaurants', description: 'Restaurant management' },
                { name: 'reservations', description: 'Reservation management' },
                { name: 'conversations', description: 'Chat/conversation management' },
                { name: 'customers', description: 'Customer CRM' },
                { name: 'webhooks', description: 'WhatsApp webhooks' },
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                },
            },
        },
    });

    await fastify.register(swaggerUi, {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: false,
        },
    });

    // ==================== ROUTES ====================

    // Health check
    fastify.get('/health', async () => {
        return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // API info
    fastify.get('/', async () => {
        return {
            name: 'Yalla Reservation API',
            version: '0.1.0',
            docs: '/docs',
            health: '/health',
        };
    });

    // Register multipart support
    await fastify.register(multipart);

    // Register static file serving for uploads
    await fastify.register(fastifyStatic, {
        root: path.join(process.cwd(), 'uploads'),
        prefix: '/uploads/',
    });

    // Register routes
    await fastify.register(authRoutes, { prefix: '/api/auth' });
    await fastify.register(reservationRoutes, { prefix: '/api/reservations' });
    await fastify.register(conversationRoutes, { prefix: '/api/conversations' });
    await fastify.register(customerRoutes, { prefix: '/api/customers' });
    await fastify.register(restaurantRoutes, { prefix: '/api/restaurants' });
    await fastify.register(uploadRoutes, { prefix: '/api/upload' });
    await fastify.register(whatsappRoutes, { prefix: '/api/whatsapp' });

    return fastify;
}
