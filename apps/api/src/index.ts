import { FastifyInstance } from 'fastify';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { redis } from './config/redis.js';
import { env } from './config/env.js';
import { buildApp } from './app.js';

let appInstance: FastifyInstance | null = null;

const startServer = async () => {
    try {
        await connectDatabase();
        appInstance = await buildApp();
        await appInstance.listen({ port: parseInt(env.PORT), host: env.HOST });
        console.log(`🚀 API Server running at http://localhost:${env.PORT}`);
        console.log(`📚 API Docs available at http://localhost:${env.PORT}/docs`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down server...`);

    if (appInstance) {
        await appInstance.close();
        console.log('HTTP server closed.');
    }

    if (redis) {
        await redis.quit();
        console.log('Redis connection closed.');
    }

    await disconnectDatabase();
    console.log('Database connection closed.');

    process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();
