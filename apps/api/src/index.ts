import { FastifyInstance } from 'fastify';
import { connectDatabase } from './config/database.js';
import './config/redis.js'; // Initialize Redis connection
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
}

const shutdown = async () => {
    console.log('\n🛑 Shutting down server...');
    if (appInstance) {
        await appInstance.close();
    }
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startServer();
