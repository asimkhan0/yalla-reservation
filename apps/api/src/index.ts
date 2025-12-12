import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { authRoutes } from './modules/auth/index.js';

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

import formbody from '@fastify/formbody';

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

// Auth routes
await fastify.register(authRoutes, { prefix: '/api/auth' });

// Reservation routes
import { reservationRoutes } from './modules/reservations/index.js';
await fastify.register(reservationRoutes, { prefix: '/api/reservations' });

// WhatsApp routes
import { whatsappRoutes } from './modules/whatsapp/index.js';
// Twilio sends form-urlencoded usually, and we need raw body sometimes for validation
// ContentTypeParser might be needed if fastify-formbody isn't registered, 
// but fastify handles application/x-www-form-urlencoded if mapped.
await fastify.register(whatsappRoutes, { prefix: '/api/whatsapp' });

// ==================== START SERVER ====================

const start = async () => {
    try {
        // Connect to MongoDB
        await connectDatabase();

        // Start server
        await fastify.listen({ port: parseInt(env.PORT), host: env.HOST });
        console.log(`🚀 API Server running at http://localhost:${env.PORT}`);
        console.log(`📚 API Docs available at http://localhost:${env.PORT}/docs`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

// Handle graceful shutdown
const shutdown = async () => {
    console.log('\n🛑 Shutting down server...');
    await fastify.close();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
