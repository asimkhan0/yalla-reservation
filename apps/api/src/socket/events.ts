/**
 * WebSocket Event Constants and Payload Builders
 * 
 * Centralized event definitions to ensure consistency
 * between publishers and subscribers.
 */

import type {
    ServerMessage,
    NewMessagePayload,
    ConversationUpdatedPayload,
    ConversationListUpdatePayload,
    ErrorPayload,
} from './types.js';

// =============================================================================
// Event Name Constants
// =============================================================================

export const SERVER_EVENTS = {
    NEW_MESSAGE: 'new_message',
    CONVERSATION_UPDATED: 'conversation_updated',
    CONVERSATION_LIST_UPDATE: 'conversation_list_update',
    ERROR: 'error',
    PONG: 'pong',
    SUBSCRIBED: 'subscribed',
    UNSUBSCRIBED: 'unsubscribed',
} as const;

export const CLIENT_EVENTS = {
    SUBSCRIBE_CONVERSATION: 'subscribe:conversation',
    UNSUBSCRIBE_CONVERSATION: 'unsubscribe:conversation',
    SUBSCRIBE_RESTAURANT: 'subscribe:restaurant',
    PING: 'ping',
} as const;

// =============================================================================
// Redis Channel Patterns
// =============================================================================

export const CHANNELS = {
    conversation: (conversationId: string) => `ws:conversation:${conversationId}`,
    restaurant: (restaurantId: string) => `ws:restaurant:${restaurantId}`,
} as const;

// =============================================================================
// Payload Builders
// =============================================================================

function createMessage<T>(type: string, payload: T): ServerMessage<T> {
    return {
        type: type as any,
        payload,
        timestamp: new Date().toISOString(),
    };
}

export const buildEvent = {
    newMessage: (payload: NewMessagePayload): ServerMessage<NewMessagePayload> =>
        createMessage(SERVER_EVENTS.NEW_MESSAGE, payload),

    conversationUpdated: (payload: ConversationUpdatedPayload): ServerMessage<ConversationUpdatedPayload> =>
        createMessage(SERVER_EVENTS.CONVERSATION_UPDATED, payload),

    conversationListUpdate: (payload: ConversationListUpdatePayload): ServerMessage<ConversationListUpdatePayload> =>
        createMessage(SERVER_EVENTS.CONVERSATION_LIST_UPDATE, payload),

    error: (code: string, message: string): ServerMessage<ErrorPayload> =>
        createMessage(SERVER_EVENTS.ERROR, { code, message }),

    pong: (): ServerMessage<null> =>
        createMessage(SERVER_EVENTS.PONG, null),

    subscribed: (channel: string): ServerMessage<{ channel: string }> =>
        createMessage(SERVER_EVENTS.SUBSCRIBED, { channel }),

    unsubscribed: (channel: string): ServerMessage<{ channel: string }> =>
        createMessage(SERVER_EVENTS.UNSUBSCRIBED, { channel }),
};
