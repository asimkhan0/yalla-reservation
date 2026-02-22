import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import {
    connectTestDb,
    disconnectTestDb,
    clearTestDb,
    createMockRestaurantData,
} from '../utils/test-helpers.js';
import { handleIncomingWebhook } from '../../modules/whatsapp/whatsapp.service.js';
import { Restaurant, Customer, Conversation, Message } from '../../models/index.js';
import { processUserMessage } from '../../modules/whatsapp/agent.service.js';
import { executeTool, getRestaurantInfoForAgent } from '../../modules/whatsapp/tools.service.js';

// Mock AI agent
vi.mock('../../modules/whatsapp/agent.service.js', () => ({
    processUserMessage: vi.fn(),
}));

// Mock tools service
vi.mock('../../modules/whatsapp/tools.service.js', () => ({
    executeTool: vi.fn(),
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

// Mock providers
vi.mock('../../modules/whatsapp/providers/twilio.provider.js', () => {
    const Mock = vi.fn();
    Mock.prototype.sendText = vi.fn().mockResolvedValue(undefined);
    Mock.prototype.parseWebhookPayload = vi.fn().mockReturnValue({
        from: '1234567890',
        to: '0987654321',
        body: 'I want to book a table',
        messageId: 'msg_123',
        profileName: 'Test User',
        timestamp: new Date(),
    });
    return { TwilioProvider: Mock };
});

describe('AI Agent Flow', () => {
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

    it('should handle tool calls in a loop', async () => {
        // Mock first call to return a tool call
        vi.mocked(processUserMessage).mockResolvedValueOnce({
            role: 'assistant',
            tool_calls: [
                {
                    id: 'call_123',
                    type: 'function',
                    function: {
                        name: 'checkAvailability',
                        arguments: JSON.stringify({ date: '2025-01-20', partySize: 4 }),
                    },
                },
            ],
        });

        // Mock second call to return final content
        vi.mocked(processUserMessage).mockResolvedValueOnce({
            role: 'assistant',
            content: 'Yes, we have availability at 19:00. Shall I book it?',
        });

        // Mock tool execution result
        vi.mocked(executeTool).mockResolvedValue({ available: true, slots: ['19:00', '20:00'] });

        const payload = { Body: 'I want to book a table' };
        await handleIncomingWebhook(restaurant, payload);

        // Verify tool was called
        expect(executeTool).toHaveBeenCalledWith(
            'checkAvailability',
            { date: '2025-01-20', partySize: 4 },
            restaurant._id.toString(),
        );

        // Verify final message was stored
        const messages = await Message.find({ sender: 'BOT' });
        expect(messages).toHaveLength(1);
        expect(messages[0].content).toBe('Yes, we have availability at 19:00. Shall I book it?');

        // Verify processUserMessage was called twice
        expect(processUserMessage).toHaveBeenCalledTimes(2);
    });
});
