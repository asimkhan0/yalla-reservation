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

    it('should return health status', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/health',
        });

        // It might be 503 if DB is not connected in this test environment,
        // which is fine as long as the structure is correct.
        expect([200, 503]).toContain(response.statusCode);

        const body = response.json();
        expect(body).toHaveProperty('status');
        expect(body).toHaveProperty('timestamp');
        expect(body).toHaveProperty('services');
        expect(body.services).toHaveProperty('database');
        expect(body.services).toHaveProperty('redis');
    });
});
