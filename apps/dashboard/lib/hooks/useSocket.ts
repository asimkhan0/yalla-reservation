/**
 * WebSocket Hook
 * 
 * Custom React hook for WebSocket connection management.
 * Handles auto-connect, reconnection, and subscription management.
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

// Helper to get cookie value
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
}

// =============================================================================
// Types
// =============================================================================

export interface SocketMessage<T = unknown> {
    type: string;
    payload: T;
    timestamp: string;
}

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

export interface ConversationListUpdatePayload {
    conversationId: string;
    lastMessage?: {
        content: string;
        sender: 'CUSTOMER' | 'BOT' | 'AGENT';
        createdAt: string;
    };
    updatedAt: string;
}

export interface ConversationUpdatedPayload {
    conversationId: string;
    changes: {
        assignedTo?: 'BOT' | 'AGENT';
        status?: string;
    };
}

type MessageHandler = (message: SocketMessage) => void;

interface UseSocketOptions {
    onNewMessage?: (payload: NewMessagePayload) => void;
    onConversationListUpdate?: (payload: ConversationListUpdatePayload) => void;
    onConversationUpdated?: (payload: ConversationUpdatedPayload) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
}

// =============================================================================
// Constants
// =============================================================================

const RECONNECT_INTERVAL = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

// =============================================================================
// Hook
// =============================================================================

export function useSocket(options: UseSocketOptions = {}) {
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectAttempts = useRef(0);
    const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const subscribedConversations = useRef<Set<string>>(new Set());

    // Stable references for callbacks
    const optionsRef = useRef(options);
    optionsRef.current = options;

    // Get WebSocket URL
    const getWsUrl = useCallback(() => {
        const token = getCookie('accessToken');
        if (!token) return null;

        // Use the API URL from environment or default
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const wsUrl = apiUrl.replace(/^http/, 'ws');
        return `${wsUrl}/ws?token=${token}`;
    }, []);

    // Handle incoming messages
    const handleMessage = useCallback((event: MessageEvent) => {
        try {
            const message: SocketMessage = JSON.parse(event.data);

            switch (message.type) {
                case 'new_message':
                    optionsRef.current.onNewMessage?.(message.payload as NewMessagePayload);
                    break;
                case 'conversation_list_update':
                    optionsRef.current.onConversationListUpdate?.(message.payload as ConversationListUpdatePayload);
                    break;
                case 'conversation_updated':
                    optionsRef.current.onConversationUpdated?.(message.payload as ConversationUpdatedPayload);
                    break;
                case 'subscribed':
                case 'unsubscribed':
                    // Acknowledgement, no action needed
                    break;
                case 'error':
                    console.error('[WebSocket] Server error:', message.payload);
                    break;
                default:
                    console.log('[WebSocket] Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
        }
    }, []);

    // Connect to WebSocket
    const connect = useCallback(() => {
        const url = getWsUrl();
        if (!url) {
            setConnectionError('No authentication token found');
            return;
        }

        // Clean up existing connection
        if (socketRef.current) {
            socketRef.current.close();
        }

        try {
            const socket = new WebSocket(url);
            socketRef.current = socket;

            socket.onopen = () => {
                console.log('[WebSocket] Connected');
                setIsConnected(true);
                setConnectionError(null);
                reconnectAttempts.current = 0;
                optionsRef.current.onConnect?.();

                // Re-subscribe to previously subscribed conversations
                for (const conversationId of subscribedConversations.current) {
                    socket.send(JSON.stringify({
                        type: 'subscribe:conversation',
                        payload: { conversationId }
                    }));
                }
            };

            socket.onmessage = handleMessage;

            socket.onclose = (event) => {
                console.log('[WebSocket] Disconnected:', event.code, event.reason);
                setIsConnected(false);
                socketRef.current = null;
                optionsRef.current.onDisconnect?.();

                // Attempt reconnection if not a clean close
                if (event.code !== 1000 && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttempts.current++;
                    console.log(`[WebSocket] Reconnecting in ${RECONNECT_INTERVAL}ms (attempt ${reconnectAttempts.current})`);
                    reconnectTimeout.current = setTimeout(connect, RECONNECT_INTERVAL);
                }
            };

            socket.onerror = (error) => {
                console.error('[WebSocket] Error:', error);
                setConnectionError('Connection error');
            };
        } catch (error) {
            console.error('[WebSocket] Failed to create connection:', error);
            setConnectionError('Failed to connect');
        }
    }, [getWsUrl, handleMessage]);

    // Subscribe to a conversation
    const subscribeToConversation = useCallback((conversationId: string) => {
        subscribedConversations.current.add(conversationId);

        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                type: 'subscribe:conversation',
                payload: { conversationId }
            }));
            console.log(`[WebSocket] Subscribed to conversation ${conversationId}`);
        }
    }, []);

    // Unsubscribe from a conversation
    const unsubscribeFromConversation = useCallback((conversationId: string) => {
        subscribedConversations.current.delete(conversationId);

        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                type: 'unsubscribe:conversation',
                payload: { conversationId }
            }));
            console.log(`[WebSocket] Unsubscribed from conversation ${conversationId}`);
        }
    }, []);

    // Disconnect
    const disconnect = useCallback(() => {
        if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
            reconnectTimeout.current = null;
        }
        if (socketRef.current) {
            socketRef.current.close(1000, 'User disconnect');
            socketRef.current = null;
        }
        setIsConnected(false);
        subscribedConversations.current.clear();
    }, []);

    // Auto-connect on mount
    useEffect(() => {
        connect();
        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return {
        isConnected,
        connectionError,
        subscribeToConversation,
        unsubscribeFromConversation,
        reconnect: connect,
        disconnect,
    };
}
