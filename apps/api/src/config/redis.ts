import Redis from 'ioredis';
import { env } from './env.js';

let redis: Redis | null = null;
let publisher: Redis | null = null;
let subscriber: Redis | null = null;

if (env.REDIS_URL) {
    redis = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: null, // Required for BullMQ
        retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    redis.on('error', (err) => {
        console.warn('Redis connection error:', err.message);
    });

    redis.on('connect', () => {
        console.log('✅ Redis connected');
    });

    // Create separate instances for Pub/Sub if needed later
    publisher = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
    subscriber = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
} else {
    console.warn('⚠️ REDIS_URL not provided. Redis features will be disabled.');
}

export { redis, publisher, subscriber };
