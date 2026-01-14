/**
 * Conversation WebSocket Handler
 * 
 * Handles client messages related to conversation subscriptions.
 */

import type { WebSocket } from 'ws';
import { roomManager } from '../room.manager.js';
import { buildEvent, CLIENT_EVENTS } from '../events.js';
import type { ClientMessage, SubscribeConversationPayload } from '../types.js';

// =============================================================================
// Handler
// =============================================================================

export function handleConversationMessage(socket: WebSocket, message: ClientMessage): void {
    switch (message.type) {
        case CLIENT_EVENTS.SUBSCRIBE_CONVERSATION:
            handleSubscribe(socket, message.payload as SubscribeConversationPayload);
            break;

        case CLIENT_EVENTS.UNSUBSCRIBE_CONVERSATION:
            handleUnsubscribe(socket, message.payload as SubscribeConversationPayload);
            break;

        default:
            // Unknown message type for this handler
            break;
    }
}

// =============================================================================
// Subscription Handlers
// =============================================================================

function handleSubscribe(socket: WebSocket, payload: SubscribeConversationPayload): void {
    if (!payload?.conversationId) {
        sendError(socket, 'INVALID_PAYLOAD', 'conversationId is required');
        return;
    }

    const success = roomManager.subscribeToConversation(socket, payload.conversationId);

    if (success) {
        const response = buildEvent.subscribed(`conversation:${payload.conversationId}`);
        socket.send(JSON.stringify(response));
    } else {
        sendError(socket, 'SUBSCRIPTION_FAILED', 'Could not subscribe to conversation');
    }
}

function handleUnsubscribe(socket: WebSocket, payload: SubscribeConversationPayload): void {
    if (!payload?.conversationId) {
        sendError(socket, 'INVALID_PAYLOAD', 'conversationId is required');
        return;
    }

    const success = roomManager.unsubscribeFromConversation(socket, payload.conversationId);

    if (success) {
        const response = buildEvent.unsubscribed(`conversation:${payload.conversationId}`);
        socket.send(JSON.stringify(response));
    }
}

// =============================================================================
// Helpers
// =============================================================================

function sendError(socket: WebSocket, code: string, message: string): void {
    const error = buildEvent.error(code, message);
    socket.send(JSON.stringify(error));
}
