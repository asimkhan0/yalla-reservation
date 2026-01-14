/**
 * WebSocket Module Entry Point
 * 
 * Registers WebSocket with Fastify and handles connection lifecycle.
 */

import type { FastifyInstance } from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import type { WebSocket } from 'ws';
import { roomManager } from './room.manager.js';
import { handleConversationMessage } from './handlers/conversation.handler.js';
import { buildEvent, CLIENT_EVENTS } from './events.js';
import type { ClientMessage, SocketContext } from './types.js';

// =============================================================================
// Plugin Registration
// =============================================================================

export async function registerWebSocket(fastify: FastifyInstance): Promise<void> {
    // Register the WebSocket plugin
    await fastify.register(fastifyWebsocket, {
        options: {
            maxPayload: 1048576, // 1MB max message size
        },
    });

    // Register the WebSocket route
    fastify.get('/ws', { websocket: true }, (socket, request) => {
        handleConnection(socket, request, fastify);
    });

    fastify.log.info('WebSocket endpoint registered at /ws');
}

// =============================================================================
// Connection Handler
// =============================================================================

function handleConnection(socket: WebSocket, request: any, fastify: FastifyInstance): void {
    // Extract token from query string
    const url = new URL(request.url, `http://${request.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
        socket.close(4001, 'Authentication required');
        return;
    }

    // Verify JWT
    let decoded: { userId: string; restaurantId: string };
    try {
        decoded = fastify.jwt.verify(token) as any;
        if (!decoded.userId || !decoded.restaurantId) {
            throw new Error('Invalid token payload');
        }
    } catch (error) {
        socket.close(4002, 'Invalid token');
        return;
    }

    // Create context for this connection
    const context: SocketContext = {
        userId: decoded.userId,
        restaurantId: decoded.restaurantId,
        subscribedConversations: new Set(),
    };

    // Register socket with room manager
    roomManager.registerSocket(socket, context);

    fastify.log.info(`WebSocket connected: user=${decoded.userId}, restaurant=${decoded.restaurantId}`);

    // Handle incoming messages
    socket.on('message', (data: Buffer) => {
        handleMessage(socket, data.toString());
    });

    // Handle ping for keep-alive
    socket.on('ping', () => {
        socket.pong();
    });

    // Handle disconnect
    socket.on('close', () => {
        roomManager.unregisterSocket(socket);
        fastify.log.info(`WebSocket disconnected: user=${decoded.userId}`);
    });

    // Handle errors
    socket.on('error', (error: Error) => {
        fastify.log.error({ err: error, userId: decoded.userId }, 'WebSocket error');
        roomManager.unregisterSocket(socket);
    });
}

// =============================================================================
// Message Handler
// =============================================================================

function handleMessage(socket: WebSocket, rawData: string): void {
    let message: ClientMessage;

    try {
        message = JSON.parse(rawData);
    } catch {
        const error = buildEvent.error('INVALID_JSON', 'Could not parse message');
        socket.send(JSON.stringify(error));
        return;
    }

    if (!message.type) {
        const error = buildEvent.error('INVALID_MESSAGE', 'Message type is required');
        socket.send(JSON.stringify(error));
        return;
    }

    // Route to appropriate handler
    switch (message.type) {
        case CLIENT_EVENTS.SUBSCRIBE_CONVERSATION:
        case CLIENT_EVENTS.UNSUBSCRIBE_CONVERSATION:
            handleConversationMessage(socket, message);
            break;

        case CLIENT_EVENTS.PING:
            const pong = buildEvent.pong();
            socket.send(JSON.stringify(pong));
            break;

        default:
            const error = buildEvent.error('UNKNOWN_TYPE', `Unknown message type: ${message.type}`);
            socket.send(JSON.stringify(error));
    }
}

// =============================================================================
// Re-exports for convenience
// =============================================================================

export * from './publisher.js';
export * from './types.js';
export * from './events.js';
