import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import {
    connectTestDb,
    disconnectTestDb,
    clearTestDb,
    createMockRestaurantData,
    createMockCustomerData,
} from '../utils/test-helpers.js';
import {
    listConversations,
    getConversationMessages,
    assignConversation,
    sendAgentMessage,
} from '../../modules/conversations/conversations.service.js';
import { Restaurant, Customer, Conversation, Message } from '../../models/index.js';
import mongoose from 'mongoose';

// Mock the WhatsApp service to avoid external calls
vi.mock('../../modules/whatsapp/whatsapp.service.js', () => ({
    sendWhatsAppMessage: vi.fn().mockResolvedValue(undefined),
}));

describe('Conversations Service', () => {
    let restaurantId: string;
    let customerId: string;

    beforeAll(async () => {
        await connectTestDb();
    });

    afterAll(async () => {
        await disconnectTestDb();
    });

    beforeEach(async () => {
        await clearTestDb();
        // Create test restaurant and customer
        const restaurant = await Restaurant.create(createMockRestaurantData());
        restaurantId = (restaurant._id as any).toString();

        const customer = await Customer.create(createMockCustomerData(restaurantId));
        customerId = (customer._id as any).toString();
    });

    describe('listConversations', () => {
        it('should return empty array when no conversations', async () => {
            const result = await listConversations(restaurantId);
            expect(result).toEqual([]);
        });

        it('should return conversations with last message', async () => {
            const conversation = await Conversation.create({
                customer: customerId,
                restaurant: restaurantId,
                status: 'ACTIVE',
                source: 'WHATSAPP',
            });

            await Message.create({
                conversation: conversation._id,
                sender: 'CUSTOMER',
                content: 'Hello!',
                direction: 'INBOUND',
                status: 'DELIVERED',
            });

            await Message.create({
                conversation: conversation._id,
                sender: 'BOT',
                content: 'Hi! How can I help?',
                direction: 'OUTBOUND',
                status: 'SENT',
            });

            const result = await listConversations(restaurantId);
            expect(result).toHaveLength(1);
            expect(result[0].lastMessage).toBeDefined();
            expect(result[0].lastMessage!.content).toBe('Hi! How can I help?');
        });

        it('should exclude archived conversations', async () => {
            await (Conversation as any).create({
                customer: customerId,
                restaurant: restaurantId,
                status: 'ACTIVE',
                source: 'WHATSAPP',
            });

            await (Conversation as any).create({
                customer: customerId,
                restaurant: restaurantId,
                status: 'ARCHIVED',
                source: 'WHATSAPP',
            });

            const result = await listConversations(restaurantId);
            expect(result).toHaveLength(1);
        });

        it('should sort conversations by updatedAt desc ensuring valid order', async () => {
            // Create two conversations with distinct timestamps
            const c1 = await Conversation.create({
                customer: customerId,
                restaurant: restaurantId,
                status: 'ACTIVE',
                updatedAt: new Date('2025-01-01T10:00:00Z'),
            });
            const c2 = await Conversation.create({
                customer: customerId,
                restaurant: restaurantId,
                status: 'ACTIVE',
                updatedAt: new Date('2025-01-01T12:00:00Z'), // Later
            });

            const result = await listConversations(restaurantId);
            expect(result).toHaveLength(2);
            // c2 (newer) should be first
            expect(result[0]._id.toString()).toBe(c2._id.toString());
            expect(result[1]._id.toString()).toBe(c1._id.toString());
        });
    });

    describe('getConversationMessages', () => {
        it('should return messages in chronological order', async () => {
            const conversation = await Conversation.create({
                customer: customerId,
                restaurant: restaurantId,
                status: 'ACTIVE',
                source: 'WHATSAPP',
            });

            // Create messages with slight delay to ensure different timestamps
            await Message.create({
                conversation: conversation._id,
                sender: 'CUSTOMER',
                content: 'First message',
                direction: 'INBOUND',
                status: 'DELIVERED',
            });

            await (Message as any).create({
                conversation: conversation._id,
                sender: 'BOT',
                content: 'Second message',
                direction: 'OUTBOUND',
                status: 'SENT',
            });

            const result = await getConversationMessages(conversation._id.toString());
            expect(result).toHaveLength(2);
            expect(result[0]!.content).toBe('First message');
            expect(result[1]!.content).toBe('Second message');
        });

        it('should NOT update conversation updatedAt timestamp', async () => {
            const conversation = await Conversation.create({
                customer: customerId,
                restaurant: restaurantId,
                status: 'ACTIVE',
                source: 'WHATSAPP',
                unreadCount: 5,
            });
            const originalUpdatedAt = conversation.updatedAt;

            // Wait a bit to ensure potential update would be noticeable
            await new Promise(resolve => setTimeout(resolve, 100));

            await getConversationMessages(conversation._id.toString());

            const updatedConversation = await Conversation.findById(conversation._id);
            expect(updatedConversation?.updatedAt.getTime()).toBe(originalUpdatedAt.getTime());
            expect(updatedConversation?.unreadCount).toBe(0);
        });
    });

    describe('assignConversation', () => {
        it('should update assignedTo field to AGENT', async () => {
            const conversation = await Conversation.create({
                customer: customerId,
                restaurant: restaurantId,
                status: 'ACTIVE',
                source: 'WHATSAPP',
                assignedTo: 'BOT',
            });

            const result = await assignConversation(conversation._id.toString(), 'AGENT');
            expect(result?.assignedTo).toBe('AGENT');
        });

        it('should update assignedTo field to BOT', async () => {
            const conversation = await Conversation.create({
                customer: customerId,
                restaurant: restaurantId,
                status: 'ACTIVE',
                source: 'WHATSAPP',
                assignedTo: 'AGENT',
            });

            const result = await assignConversation(conversation._id.toString(), 'BOT');
            expect(result?.assignedTo).toBe('BOT');
        });
    });

    describe('sendAgentMessage', () => {
        it('should create an outbound agent message', async () => {
            const conversation = await Conversation.create({
                customer: customerId,
                restaurant: restaurantId,
                status: 'ACTIVE',
                source: 'WHATSAPP',
            });

            const result = await sendAgentMessage(conversation._id.toString(), 'Hello from agent!');

            expect(result).toBeDefined();
            expect(result.content).toBe('Hello from agent!');
            expect(result.direction).toBe('OUTBOUND');
            expect(result.sender).toBe('AGENT');
            expect(result.status).toBe('SENT');
        });

        it('should throw error for non-existent conversation', async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            await expect(
                sendAgentMessage(fakeId, 'Hello!')
            ).rejects.toThrow('Conversation not found');
        });
    });
});
