import { Message, Conversation, Customer, Restaurant } from '../../models/index.js';
import { env } from '../../config/env.js';
import { processUserMessage } from './agent.service.js';
import { executeTool, getRestaurantInfoForAgent } from './tools.service.js';
import { IWhatsAppProvider, IncomingMessageData } from './providers/whatsapp.provider.interface.js';
import { TwilioProvider } from './providers/twilio.provider.js';
import { MetaProvider } from './providers/meta.provider.js';

// Factory to get provider instance
export function getProvider(restaurant: any): IWhatsAppProvider {
    const config = restaurant.whatsappConfig;

    if (!config || !config.enabled) {
        throw new Error('WhatsApp integration not enabled for this restaurant');
    }

    switch (config.provider) {
        case 'twilio':
            return new TwilioProvider({
                accountSid: config.accountSid,
                authToken: config.authToken,
                phoneNumber: config.phoneNumber
            });
        case 'meta':
            return new MetaProvider({
                phoneNumberId: config.phoneNumberId,
                accessToken: config.accessToken
            });
        default:
            throw new Error(`Unsupported provider: ${config.provider}`);
    }
}

// Unified Handler for incoming webhooks
export async function handleIncomingWebhook(restaurant: any, payload: any) {
    try {
        const provider = getProvider(restaurant);
        const data: IncomingMessageData = provider.parseWebhookPayload(payload);

        // Use normalized data
        const { from, body, profileName } = data;
        const phone = from;

        // 1. Find Customer
        let customer = await Customer.findOne({
            restaurant: restaurant._id, // Scoped to restaurant
            phone: phone
        });

        if (!customer) {
            // Parse name
            const fullName = profileName || 'Unknown User';
            const nameParts = fullName.split(' ');
            const firstName = nameParts[0] || 'Unknown';
            const lastName = nameParts.slice(1).join(' ') || '';

            customer = await Customer.create({
                phone,
                phoneCountry: 'US', // TODO: Parse from phone number
                firstName,
                lastName,
                restaurant: restaurant._id,
                isVip: false,
                preferences: {}
            });
        }

        // 2. Find active conversation
        let conversation = await (Conversation as any).findOne({
            customer: customer._id,
            restaurant: restaurant._id,
            status: { $ne: 'resolved' }
        }).sort({ updatedAt: -1 });

        if (!conversation) {
            conversation = await (Conversation as any).create({
                customer: customer._id,
                restaurant: restaurant._id,
                status: 'ACTIVE',
                source: 'WHATSAPP',
                context: {}
            });
        }

        // 3. Store User Message
        const currentMessage = await (Message as any).create({
            content: body,
            direction: 'INBOUND',
            sender: 'CUSTOMER',
            whatsappMsgId: data.messageId,
            status: 'DELIVERED',
            conversation: conversation._id
        });

        if (conversation.assignedTo === 'AGENT') {
            console.log(`[WhatsApp] Conversation ${conversation._id} assigned to AGENT. Bot skipping.`);
            return;
        }

        // 4. Trigger AI Agent
        await triggerAiAgent(conversation, currentMessage, body, provider);

    } catch (error) {
        console.error('[WhatsApp Service] Error processing webhook:', error);
        throw error;
    }
}

// AI Agent Trigger Logic
async function triggerAiAgent(conversation: any, currentMessage: any, userMessage: string, provider: IWhatsAppProvider) {
    // Fetch conversation history
    const rawHistory = await (Message as any).find({
        conversation: conversation._id,
        _id: { $ne: currentMessage._id }
    })
        .sort({ createdAt: -1 }) // Newest first
        .limit(10) // Limit context window
        .select('role content sender -_id')
        .lean();

    const history = rawHistory.reverse();

    const formattedHistory = history.map((msg: any) => ({
        role: msg.sender === 'BOT' ? 'assistant' : 'user',
        content: msg.content,
    }));

    // Get restaurant info
    const restaurantInfo = await getRestaurantInfoForAgent(); // TODO: this needs to be scoped to restaurant._id if we support multiple
    if (!restaurantInfo) {
        console.error('[WhatsApp] No restaurant info available for agent');
        return;
    }

    // Initial call to AI
    let aiResponse = await processUserMessage(userMessage, formattedHistory as any[], restaurantInfo);
    let iterations = 0;
    const MAX_ITERATIONS = 3;

    // Loop to handle tool calls
    while (aiResponse && aiResponse.tool_calls && iterations < MAX_ITERATIONS) {
        iterations++;
        const toolCalls = aiResponse.tool_calls;
        console.log(`[AI Agent] Iteration ${iterations}: Executing ${toolCalls.length} tool(s)`);

        formattedHistory.push(aiResponse as any);

        for (const toolCall of toolCalls) {
            try {
                const args = JSON.parse(toolCall.function.arguments);
                const result = await executeTool(toolCall.function.name, args);

                formattedHistory.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(result)
                } as any);
            } catch (err: any) {
                console.error(`[AI Agent] Tool execution failed: ${err.message}`);
                formattedHistory.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify({ error: err.message })
                } as any);
            }
        }

        aiResponse = await processUserMessage('', formattedHistory as any, restaurantInfo);
    }

    // 5. Send Final Response
    if (aiResponse && aiResponse.content) {
        // Send via Provider
        const customer = await Customer.findById(conversation.customer);
        if (customer) {
            await provider.sendText(customer.phone, aiResponse.content);
        } else {
            console.error('[WhatsApp Service] Customer not found for sending response');
        }

        await (Message as any).create({
            content: aiResponse.content,
            direction: 'OUTBOUND',
            sender: 'BOT',
            status: 'SENT',
            conversation: conversation._id
        });
    }
}

// Keep generic send for other internal uses
export async function sendWhatsAppMessage(restaurantId: string, to: string, body: string) {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) throw new Error('Restaurant not found');

    const provider = getProvider(restaurant);
    await provider.sendText(to, body);
}

// Handle Test Chat (Simulated)
export async function handleTestChat(message: string, phoneNumber: string = '1234567890') {
    // 1. Mock Restaurant (First one)
    let restaurant = await Restaurant.findOne();
    if (!restaurant) throw new Error('No restaurant found');

    // 2. Find/Create Customer
    let customer = await Customer.findOne({ phone: phoneNumber });
    if (!customer) {
        customer = await Customer.create({
            phone: phoneNumber,
            phoneCountry: 'US',
            firstName: 'Test',
            lastName: 'User',
            restaurant: restaurant._id,
            isVip: false,
            preferences: {}
        });
    }

    // 3. Find/Create Conversation
    let conversation = await (Conversation as any).findOne({
        customer: customer._id,
        status: { $ne: 'resolved' }
    }).sort({ updatedAt: -1 });

    if (!conversation) {
        conversation = await (Conversation as any).create({
            customer: customer._id,
            restaurant: restaurant._id,
            status: 'ACTIVE',
            source: 'API_TEST',
            context: {}
        });
    }

    // 4. Save User Message
    const currentMessage = await (Message as any).create({
        content: message,
        direction: 'INBOUND',
        sender: 'CUSTOMER',
        whatsappMsgId: `test-${Date.now()}`,
        status: 'DELIVERED',
        conversation: conversation._id
    });

    if (conversation.assignedTo === 'AGENT') {
        return "Conversation is assigned to a human agent. Bot is paused.";
    }

    // 5. Trigger AI Agent (Reuse Logic mostly, but distinct for return value)
    // Reuse logic from triggerAiAgent but return the response string
    // For now, simpler:

    // Fetch conversation history
    const rawHistory = await (Message as any).find({
        conversation: conversation._id,
        _id: { $ne: currentMessage._id }
    }).sort({ createdAt: -1 }).limit(10).select('role content sender -_id').lean();

    const history = rawHistory.reverse();

    const formattedHistory = history.map((msg: any) => ({
        role: msg.sender === 'BOT' ? 'assistant' : 'user',
        content: msg.content,
    }));

    const restaurantInfo = await getRestaurantInfoForAgent();
    if (!restaurantInfo) return "Error: No restaurant info available.";

    let aiResponse = await processUserMessage(message, formattedHistory as any[], restaurantInfo);
    let iterations = 0;

    while (aiResponse && aiResponse.tool_calls && iterations < 3) {
        iterations++;
        const toolCalls = aiResponse.tool_calls;
        formattedHistory.push(aiResponse as any);
        for (const toolCall of toolCalls) {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await executeTool(toolCall.function.name, args);
            formattedHistory.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(result)
            } as any);
        }
        aiResponse = await processUserMessage('', formattedHistory as any, restaurantInfo);
    }

    if (aiResponse && aiResponse.content) {
        await (Message as any).create({
            content: aiResponse.content,
            direction: 'OUTBOUND',
            sender: 'BOT',
            status: 'SENT',
            conversation: conversation._id
        });
        return aiResponse.content;
    }

    return "No response from AI.";
}



