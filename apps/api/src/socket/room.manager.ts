/**
 * Room Manager
 * 
 * Manages WebSocket connection subscriptions to conversation/restaurant rooms.
 * Uses Redis Pub/Sub for horizontal scaling across multiple API instances.
 */

import type { WebSocket } from 'ws';
import { subscriber } from '../config/redis.js';
import { CHANNELS } from './events.js';
import type { SocketContext, ServerMessage } from './types.js';

// =============================================================================
// Types
// =============================================================================

interface ManagedSocket {
    socket: WebSocket;
    context: SocketContext;
}

// =============================================================================
// Room Manager Class
// =============================================================================

class RoomManager {
    // Map of conversationId -> Set of sockets subscribed to it
    private conversationRooms: Map<string, Set<ManagedSocket>> = new Map();

    // Map of restaurantId -> Set of sockets subscribed to it
    private restaurantRooms: Map<string, Set<ManagedSocket>> = new Map();

    // Map of socket -> ManagedSocket for cleanup
    private socketRegistry: Map<WebSocket, ManagedSocket> = new Map();

    // Track Redis subscriptions to avoid duplicates
    private activeRedisChannels: Set<string> = new Set();

    constructor() {
        this.initializeRedisSubscriber();
    }

    private initializeRedisSubscriber(): void {
        if (!subscriber) {
            console.warn('[RoomManager] Redis subscriber not available. Real-time features limited to single instance.');
            return;
        }

        subscriber.on('message', (channel: string, message: string) => {
            this.handleRedisMessage(channel, message);
        });

        console.log('[RoomManager] Redis subscriber initialized');
    }

    private handleRedisMessage(channel: string, message: string): void {
        try {
            const parsedMessage = JSON.parse(message) as ServerMessage;

            // Determine which room this message belongs to
            if (channel.startsWith('ws:conversation:')) {
                const conversationId = channel.replace('ws:conversation:', '');
                this.broadcastToConversation(conversationId, parsedMessage);
            } else if (channel.startsWith('ws:restaurant:')) {
                const restaurantId = channel.replace('ws:restaurant:', '');
                this.broadcastToRestaurant(restaurantId, parsedMessage);
            }
        } catch (error) {
            console.error('[RoomManager] Error parsing Redis message:', error);
        }
    }

    // =========================================================================
    // Registration
    // =========================================================================

    registerSocket(socket: WebSocket, context: SocketContext): void {
        const managed: ManagedSocket = { socket, context };
        this.socketRegistry.set(socket, managed);

        // Auto-subscribe to restaurant channel for conversation list updates
        this.subscribeToRestaurant(socket, context.restaurantId);

        console.log(`[RoomManager] Socket registered for user ${context.userId}`);
    }

    unregisterSocket(socket: WebSocket): void {
        const managed = this.socketRegistry.get(socket);
        if (!managed) return;

        // Remove from all conversation rooms
        for (const conversationId of managed.context.subscribedConversations) {
            this.unsubscribeFromConversation(socket, conversationId);
        }

        // Remove from restaurant room
        this.unsubscribeFromRestaurant(socket, managed.context.restaurantId);

        this.socketRegistry.delete(socket);
        console.log(`[RoomManager] Socket unregistered for user ${managed.context.userId}`);
    }

    // =========================================================================
    // Conversation Subscriptions
    // =========================================================================

    subscribeToConversation(socket: WebSocket, conversationId: string): boolean {
        const managed = this.socketRegistry.get(socket);
        if (!managed) return false;

        // Add to room
        if (!this.conversationRooms.has(conversationId)) {
            this.conversationRooms.set(conversationId, new Set());
            this.subscribeRedisChannel(CHANNELS.conversation(conversationId));
        }
        this.conversationRooms.get(conversationId)!.add(managed);
        managed.context.subscribedConversations.add(conversationId);

        console.log(`[RoomManager] Socket subscribed to conversation ${conversationId}`);
        return true;
    }

    unsubscribeFromConversation(socket: WebSocket, conversationId: string): boolean {
        const managed = this.socketRegistry.get(socket);
        if (!managed) return false;

        const room = this.conversationRooms.get(conversationId);
        if (room) {
            room.delete(managed);
            if (room.size === 0) {
                this.conversationRooms.delete(conversationId);
                this.unsubscribeRedisChannel(CHANNELS.conversation(conversationId));
            }
        }
        managed.context.subscribedConversations.delete(conversationId);

        console.log(`[RoomManager] Socket unsubscribed from conversation ${conversationId}`);
        return true;
    }

    // =========================================================================
    // Restaurant Subscriptions
    // =========================================================================

    private subscribeToRestaurant(socket: WebSocket, restaurantId: string): void {
        const managed = this.socketRegistry.get(socket);
        if (!managed) return;

        if (!this.restaurantRooms.has(restaurantId)) {
            this.restaurantRooms.set(restaurantId, new Set());
            this.subscribeRedisChannel(CHANNELS.restaurant(restaurantId));
        }
        this.restaurantRooms.get(restaurantId)!.add(managed);
    }

    private unsubscribeFromRestaurant(socket: WebSocket, restaurantId: string): void {
        const managed = this.socketRegistry.get(socket);
        if (!managed) return;

        const room = this.restaurantRooms.get(restaurantId);
        if (room) {
            room.delete(managed);
            if (room.size === 0) {
                this.restaurantRooms.delete(restaurantId);
                this.unsubscribeRedisChannel(CHANNELS.restaurant(restaurantId));
            }
        }
    }

    // =========================================================================
    // Redis Channel Management
    // =========================================================================

    private subscribeRedisChannel(channel: string): void {
        if (!subscriber || this.activeRedisChannels.has(channel)) return;

        subscriber.subscribe(channel);
        this.activeRedisChannels.add(channel);
        console.log(`[RoomManager] Subscribed to Redis channel: ${channel}`);
    }

    private unsubscribeRedisChannel(channel: string): void {
        if (!subscriber || !this.activeRedisChannels.has(channel)) return;

        subscriber.unsubscribe(channel);
        this.activeRedisChannels.delete(channel);
        console.log(`[RoomManager] Unsubscribed from Redis channel: ${channel}`);
    }

    // =========================================================================
    // Broadcasting
    // =========================================================================

    private broadcastToConversation(conversationId: string, message: ServerMessage): void {
        const room = this.conversationRooms.get(conversationId);
        if (!room) return;

        const data = JSON.stringify(message);
        for (const managed of room) {
            this.safeSend(managed.socket, data);
        }
    }

    private broadcastToRestaurant(restaurantId: string, message: ServerMessage): void {
        const room = this.restaurantRooms.get(restaurantId);
        if (!room) return;

        const data = JSON.stringify(message);
        for (const managed of room) {
            this.safeSend(managed.socket, data);
        }
    }

    private safeSend(socket: WebSocket, data: string): void {
        if (socket.readyState === socket.OPEN) {
            socket.send(data);
        }
    }

    // =========================================================================
    // Utilities
    // =========================================================================

    getStats(): { connections: number; conversationRooms: number; restaurantRooms: number } {
        return {
            connections: this.socketRegistry.size,
            conversationRooms: this.conversationRooms.size,
            restaurantRooms: this.restaurantRooms.size,
        };
    }
}

// Singleton instance
export const roomManager = new RoomManager();
