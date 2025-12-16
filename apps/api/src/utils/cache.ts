import { redis } from '../config/redis.js';

export const CacheKeys = {
    restaurantConfig: (id: string) => `restaurant:${id}:config`,
    conversation: (id: string) => `conversation:${id}`,
    customer: (phone: string) => `customer:${phone}`,
};

export const DEFAULT_EXPIRATION = 3600;

export const cacheService = {
    async get<T>(key: string): Promise<T | null> {
        if (!redis) return null;
        try {
            const data = await redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    },

    async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
        if (!redis) return;
        try {
            await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        } catch (error) {
            console.error(`Cache set error for key ${key}:`, error);
        }
    },

    async del(key: string): Promise<void> {
        if (!redis) return;
        try {
            await redis.del(key);
        } catch (error) {
            console.error(`Cache del error for key ${key}:`, error);
        }
    },

    async flushPattern(pattern: string): Promise<void> {
        const client = redis;
        if (!client) return;

        try {
            // Use scan to delete keys by pattern
            const stream = client.scanStream({ match: pattern });
            stream.on('data', async (keys) => {
                if (keys.length) {
                    const pipeline = client.pipeline();
                    keys.forEach((key: string) => pipeline.del(key));
                    await pipeline.exec();
                }
            });
        } catch (error) {
            console.error(`Cache flush error for pattern ${pattern}:`, error);
        }
    },

    async getOrSetCache<T>(key: string, callback: () => Promise<T>, ttlSeconds: number = DEFAULT_EXPIRATION): Promise<T> {
        return new Promise(async (resolve, reject) => {
            if (!redis) {
                try {
                    return resolve(await callback());
                } catch (e) {
                    return reject(e);
                }
            }
            redis.get(key, async (error, data) => {
                if (error) return reject(error);

                if (data != null) return resolve(JSON.parse(data))

                try {
                    const result = await callback();
                    await redis?.setex(key, ttlSeconds, JSON.stringify(result));
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            })
        })
    },
};
