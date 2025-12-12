import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.schema.js';
import * as authService from './auth.service.js';

export async function authRoutes(fastify: FastifyInstance) {
    // Register
    fastify.post(
        '/register',
        {
            schema: {
                tags: ['auth'],
                description: 'Register a new user and restaurant',
                body: {
                    type: 'object',
                    required: ['email', 'password', 'firstName', 'lastName', 'restaurantName', 'restaurantSlug'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string', minLength: 8 },
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        phone: { type: 'string' },
                        restaurantName: { type: 'string' },
                        restaurantSlug: { type: 'string' },
                    },
                },
                response: {
                    201: {
                        type: 'object',
                        properties: {
                            user: { type: 'object' },
                            restaurant: { type: 'object' },
                            accessToken: { type: 'string' },
                            refreshToken: { type: 'string' },
                        },
                    },
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                const data = registerSchema.parse(request.body);
                const result = await authService.registerUser(data);
                return reply.status(201).send(result);
            } catch (error: any) {
                if (error.message === 'Email already registered' || error.message === 'Restaurant slug already taken') {
                    return reply.status(409).send({ error: error.message });
                }
                fastify.log.error(error);
                return reply.status(400).send({ error: error.message || 'Registration failed' });
            }
        }
    );

    // Login
    fastify.post(
        '/login',
        {
            schema: {
                tags: ['auth'],
                description: 'Login with email and password',
                body: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string' },
                    },
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            user: { type: 'object' },
                            restaurant: { type: 'object' },
                            accessToken: { type: 'string' },
                            refreshToken: { type: 'string' },
                        },
                    },
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                const data = loginSchema.parse(request.body);
                const result = await authService.loginUser(data);
                return reply.send(result);
            } catch (error: any) {
                if (error.message === 'Invalid email or password') {
                    return reply.status(401).send({ error: error.message });
                }
                fastify.log.error(error);
                return reply.status(400).send({ error: error.message || 'Login failed' });
            }
        }
    );

    // Refresh token
    fastify.post(
        '/refresh',
        {
            schema: {
                tags: ['auth'],
                description: 'Refresh access token',
                body: {
                    type: 'object',
                    required: ['refreshToken'],
                    properties: {
                        refreshToken: { type: 'string' },
                    },
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            accessToken: { type: 'string' },
                        },
                    },
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                const { refreshToken } = refreshTokenSchema.parse(request.body);
                const result = await authService.refreshAccessToken(refreshToken);
                return reply.send(result);
            } catch (error: any) {
                return reply.status(401).send({ error: 'Invalid refresh token' });
            }
        }
    );

    // Get current user (protected)
    fastify.get(
        '/me',
        {
            schema: {
                tags: ['auth'],
                description: 'Get current authenticated user',
                security: [{ bearerAuth: [] }],
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            email: { type: 'string' },
                            firstName: { type: 'string' },
                            lastName: { type: 'string' },
                            role: { type: 'string' },
                            restaurant: { type: 'object' },
                        },
                    },
                },
            },
            preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
                try {
                    await request.jwtVerify();
                } catch (err) {
                    return reply.status(401).send({ error: 'Unauthorized' });
                }
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                const user = request.user as { userId: string };
                const result = await authService.getCurrentUser(user.userId);
                return reply.send(result);
            } catch (error: any) {
                return reply.status(404).send({ error: 'User not found' });
            }
        }
    );
}
