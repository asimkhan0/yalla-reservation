import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import {
    connectTestDb,
    disconnectTestDb,
    clearTestDb,
    createMockRestaurantData,
} from '../utils/test-helpers.js';
import { getProvider, handleIncomingWebhook } from '../../modules/whatsapp/whatsapp.service.js';
import { Restaurant, Customer, Conversation, Message } from '../../models/index.js';
import { TwilioProvider } from '../../modules/whatsapp/providers/twilio.provider.js';
import { MetaProvider } from '../../modules/whatsapp/providers/meta.provider.js';

// Mock AI agent to avoid real API calls
vi.mock('../../modules/whatsapp/agent.service.js', () => ({
    processUserMessage: vi.fn().mockResolvedValue({
        content: 'Hello, how can I help you?',
        role: 'assistant',
    }),
    getRestaurantInfoForAgent: vi.fn().mockResolvedValue({
        id: '123',
        name: 'Test Restaurant',
        cuisine: ['Italian'],
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        country: 'Testland',
        phone: '1234567890',
        email: 'test@example.com',
    }),
}));

// Mock providers to avoid real network calls
vi.mock('../../modules/whatsapp/providers/twilio.provider.js', () => {
    const Mock = vi.fn();
    Mock.prototype.sendText = vi.fn().mockResolvedValue(undefined);
    Mock.prototype.parseWebhookPayload = vi.fn().mockReturnValue({
        from: '1234567890',
        to: '0987654321',
        body: 'Hello',
        messageId: 'msg_123',
        profileName: 'Test User',
        timestamp: new Date(),
    });
    return { TwilioProvider: Mock };
});

vi.mock('../../modules/whatsapp/providers/meta.provider.js', () => {
    const Mock = vi.fn();
    Mock.prototype.sendText = vi.fn().mockResolvedValue(undefined);
    Mock.prototype.parseWebhookPayload = vi.fn().mockReturnValue({
        from: '1234567890',
        to: '0987654321',
        body: 'Hello',
        messageId: 'msg_456',
        profileName: 'Meta User',
        timestamp: new Date(),
    });
    return { MetaProvider: Mock };
});

describe('WhatsApp Service', () => {
    let restaurant: any;

    beforeAll(async () => {
        await connectTestDb();
    });

    afterAll(async () => {
        await disconnectTestDb();
    });

    beforeEach(async () => {
        await clearTestDb();
        restaurant = await Restaurant.create({
            ...createMockRestaurantData(),
            whatsappConfig: {
                enabled: true,
                provider: 'twilio',
                accountSid: 'ACxxx',
                authToken: 'auth_xxx',
                phoneNumber: 'whatsapp:+1234567890',
            },
        });
    });

    describe('getProvider', () => {
        it('should return TwilioProvider for twilio config', () => {
            const provider = getProvider(restaurant);
            expect(provider).toBeInstanceOf(TwilioProvider);
        });

        it('should return MetaProvider for meta config', async () => {
            restaurant.whatsappConfig = {
                enabled: true,
                provider: 'meta',
                phoneNumberId: 'phone_123',
                accessToken: 'token_123',
                wabaId: 'waba_123',
            };
            const provider = getProvider(restaurant);
            expect(provider).toBeInstanceOf(MetaProvider);
        });

        it('should throw error if integration is disabled', () => {
            restaurant.whatsappConfig.enabled = false;
            expect(() => getProvider(restaurant)).toThrow('WhatsApp integration not enabled');
        });
    });

    describe('handleIncomingWebhook', () => {
        it('should create customer, conversation and message for new user', async () => {
            const payload = { Body: 'Hello', From: 'whatsapp:+1234567890' };

            await handleIncomingWebhook(restaurant, payload);

            // Verify Customer created
            const customer = await Customer.findOne({ restaurant: restaurant._id });
            expect(customer).toBeDefined();
            expect(customer?.phone).toBe('1234567890');

            // Verify Conversation created
            const conversation = await Conversation.findOne({ restaurant: restaurant._id });
            expect(conversation).toBeDefined();
            expect(conversation?.customer.toString()).toBe(customer?._id.toString());

            // Verify Messages stored (1 inbound, 1 outbound)
            const messages = await Message.find({ conversation: conversation?._id });
            expect(messages).toHaveLength(2);
            expect(messages.some((m) => m.direction === 'INBOUND')).toBe(true);
            expect(messages.some((m) => m.direction === 'OUTBOUND')).toBe(true);
        });

        it('should use existing customer and conversation', async () => {
            const customer = await Customer.create({
                restaurant: restaurant._id,
                phone: '1234567890',
                firstName: 'Existing',
                lastName: 'User',
                phoneCountry: 'US',
            });

            const conversation = await Conversation.create({
                restaurant: restaurant._id,
                customer: customer._id,
                status: 'ACTIVE',
                source: 'WHATSAPP',
            });

            const payload = { Body: 'Hello again' };
            await handleIncomingWebhook(restaurant, payload);

            const messages = await Message.find({ conversation: conversation._id }).sort({
                createdAt: 1,
            });
            expect(messages).toHaveLength(2);
            expect(messages[0].content).toBe('Hello'); // Mock return value from provider.parseWebhookPayload is 'Hello'
            expect(messages[1].sender).toBe('BOT');

            const conversationCount = await Conversation.countDocuments({
                restaurant: restaurant._id,
            });
            expect(conversationCount).toBe(1);
        });

        it('should not trigger AI agent if assigned to a human', async () => {
            const customer = await Customer.create({
                restaurant: restaurant._id,
                phone: '1234567890',
                firstName: 'Existing',
                lastName: 'User',
                phoneCountry: 'US',
            });

            await Conversation.create({
                restaurant: restaurant._id,
                customer: customer._id,
                status: 'ACTIVE',
                assignedTo: 'AGENT',
            });

            const payload = { Body: 'Help me human' };
            await handleIncomingWebhook(restaurant, payload);

            // Message should still be stored
            const message = await Message.findOne({ content: 'Hello' }); // Mocked body is 'Hello'
            expect(message).toBeDefined();

            // Bot response should NOT be created
            const botMessage = await Message.findOne({ sender: 'BOT' });
            expect(botMessage).toBeNull();
        });
    });
});
