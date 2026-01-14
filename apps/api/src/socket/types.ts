/**
 * WebSocket Event Types and Interfaces
 * 
 * This file defines all TypeScript types for WebSocket events,
 * ensuring type safety across the real-time communication layer.
 */

// =============================================================================
// Client -> Server Messages
// =============================================================================

export interface ClientMessage {
    type: ClientEventType;
    payload: unknown;
}

export type ClientEventType =
    | 'subscribe:conversation'
    | 'unsubscribe:conversation'
    | 'subscribe:restaurant'
    | 'ping';

export interface SubscribeConversationPayload {
    conversationId: string;
}

export interface SubscribeRestaurantPayload {
    restaurantId: string;
}

// =============================================================================
// Server -> Client Messages
// =============================================================================

export interface ServerMessage<T = unknown> {
    type: ServerEventType;
    payload: T;
    timestamp: string;
}

export type ServerEventType =
    | 'new_message'
    | 'conversation_updated'
    | 'conversation_list_update'
    | 'error'
    | 'pong'
    | 'subscribed'
    | 'unsubscribed';

// =============================================================================
// Event Payloads
// =============================================================================

export interface NewMessagePayload {
    conversationId: string;
    message: {
        _id: string;
        content: string;
        sender: 'CUSTOMER' | 'BOT' | 'AGENT';
        direction: 'INBOUND' | 'OUTBOUND';
        createdAt: string;
        status: string;
    };
}

export interface ConversationUpdatedPayload {
    conversationId: string;
    changes: {
        assignedTo?: 'BOT' | 'AGENT';
        status?: string;
        unreadCount?: number;
        updatedAt?: string;
    };
}

export interface ConversationListUpdatePayload {
    conversationId: string;
    lastMessage?: {
        content: string;
        sender: 'CUSTOMER' | 'BOT' | 'AGENT';
        createdAt: string;
    };
    updatedAt: string;
}

export interface ErrorPayload {
    code: string;
    message: string;
}

// =============================================================================
// Connection Context (attached to WebSocket connection)
// =============================================================================

export interface SocketContext {
    userId: string;
    restaurantId: string;
    subscribedConversations: Set<string>;
}
