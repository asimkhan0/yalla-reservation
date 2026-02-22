import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import formbody from '@fastify/formbody';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { redis } from './config/redis.js';
import { ApiError } from './utils/api-errors.js';
import { authRoutes } from './modules/auth/index.js';
import { reservationRoutes } from './modules/reservations/index.js';
import { conversationRoutes } from './modules/conversations/index.js';
import { customerRoutes } from './modules/customers/index.js';
import { restaurantRoutes } from './modules/restaurants/index.js';
import { whatsappRoutes } from './modules/whatsapp/index.js';
import { uploadRoutes } from './modules/uploads/uploads.routes.js';
import { analyticsRoutes } from './modules/analytics/index.js';

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

    // Register security plugins
    await fastify.register(helmet);
    await fastify.register(rateLimit, {
        max: env.NODE_ENV === 'test' ? 1000 : 100, // Higher limit for tests
        timeWindow: '1 minute',
    });

    // Register plugins
    const corsOrigin = env.CORS_ORIGIN.includes(',') ? env.CORS_ORIGIN.split(',') : env.CORS_ORIGIN;

    await fastify.register(cors, {
        origin: corsOrigin,
        credentials: env.CORS_ORIGIN !== '*', // Disable credentials for wildcard
    });
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

    // Global Error Handler
    fastify.setErrorHandler((error, request, reply) => {
        if (error instanceof ApiError) {
            return reply.status(error.statusCode).send({
                success: false,
                error: {
                    code: error.code,
                    message: error.message,
                },
            });
        }

        // Fastify validation errors
        if (error.validation) {
            return reply.status(400).send({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Validation failed',
                    details: error.validation,
                },
            });
        }

        // Default error
        fastify.log.error(error);
        return reply.status(500).send({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
            },
        });
    });

    await fastify.register(swagger, {
        openapi: {
            info: {
                title: 'DineLine API',
                description:
                    'REST API for restaurant reservation system with WhatsApp bot integration',
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
    fastify.get('/health', async (request, reply) => {
        const dbStatus = mongoose.connection.readyState === 1 ? 'up' : 'down';
        const redisStatus = redis && (redis as any).status === 'ready' ? 'up' : 'down';

        const isHealthy = dbStatus === 'up';

        return reply.status(isHealthy ? 200 : 503).send({
            status: isHealthy ? 'ok' : 'error',
            timestamp: new Date().toISOString(),
            services: {
                database: dbStatus,
                redis: env.REDIS_URL ? redisStatus : 'disabled',
            },
        });
    });

    // API info
    fastify.get('/', async () => {
        return {
            name: 'DineLine API',
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
    await fastify.register(analyticsRoutes, { prefix: '/api/analytics' });
    await fastify.register(whatsappRoutes, { prefix: '/api/whatsapp' });

    return fastify;
}
