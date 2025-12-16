import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../app.js';
import { FastifyInstance } from 'fastify';

describe('Health Check', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = await buildApp();
        // Wait for plugins to load
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should return 200 OK', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/health',
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
            status: 'ok',
            timestamp: expect.any(String),
        });
    });
});
