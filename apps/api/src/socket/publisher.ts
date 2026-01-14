/**
 * WebSocket Event Publisher
 * 
 * Decoupled publisher that services can import to emit events
 * without knowing WebSocket internals. Publishes to Redis for
 * cross-instance delivery.
 */

import { publisher } from '../config/redis.js';
import { CHANNELS, buildEvent } from './events.js';
import type { NewMessagePayload, ConversationListUpdatePayload } from './types.js';

// =============================================================================
// Publisher Functions
// =============================================================================

/**
 * Publish a new message event to a conversation channel.
 * Called when a message is saved (inbound from WhatsApp or outbound from agent).
 */
export async function publishNewMessage(
    conversationId: string,
    message: NewMessagePayload['message']
): Promise<void> {
    const payload: NewMessagePayload = { conversationId, message };
    const event = buildEvent.newMessage(payload);

    await publishToChannel(CHANNELS.conversation(conversationId), event);
    console.log(`[Publisher] NEW_MESSAGE sent to conversation ${conversationId}`);
}

/**
 * Publish a conversation list update to a restaurant channel.
 * Called when a conversation's last message or position should update in the sidebar.
 */
export async function publishConversationListUpdate(
    restaurantId: string,
    conversationId: string,
    lastMessage?: { content: string; sender: 'CUSTOMER' | 'BOT' | 'AGENT'; createdAt: string }
): Promise<void> {
    const payload: ConversationListUpdatePayload = {
        conversationId,
        lastMessage,
        updatedAt: new Date().toISOString(),
    };
    const event = buildEvent.conversationListUpdate(payload);

    await publishToChannel(CHANNELS.restaurant(restaurantId), event);
    console.log(`[Publisher] CONVERSATION_LIST_UPDATE sent to restaurant ${restaurantId}`);
}

/**
 * Publish a conversation updated event (assignment change, status change, etc.)
 */
export async function publishConversationUpdated(
    conversationId: string,
    restaurantId: string,
    changes: { assignedTo?: 'BOT' | 'AGENT'; status?: string }
): Promise<void> {
    const event = buildEvent.conversationUpdated({ conversationId, changes });

    // Publish to both conversation-specific and restaurant channels
    await publishToChannel(CHANNELS.conversation(conversationId), event);
    await publishToChannel(CHANNELS.restaurant(restaurantId), event);
    console.log(`[Publisher] CONVERSATION_UPDATED sent for ${conversationId}`);
}

// =============================================================================
// Internal Helper
// =============================================================================

async function publishToChannel(channel: string, message: object): Promise<void> {
    if (!publisher) {
        console.warn('[Publisher] Redis publisher not available. Event not published.');
        return;
    }

    try {
        await publisher.publish(channel, JSON.stringify(message));
    } catch (error) {
        console.error(`[Publisher] Failed to publish to ${channel}:`, error);
    }
}
