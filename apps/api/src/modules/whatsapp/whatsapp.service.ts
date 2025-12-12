import { Message, Conversation, Customer } from '../../models/index.js';
import { env } from '../../config/env.js';
import { processUserMessage } from './agent.service.js';
import { executeTool } from './tools.service.js';

interface TwilioMessage {
    Body: string;
    From: string; // format: "whatsapp:+1234567890"
    WaId: string; // format: "1234567890"
    ProfileName?: string;
    MessageSid: string;
}

export async function handleIncomingMessage(data: TwilioMessage) {
    const { WaId, Body, ProfileName, From } = data;
    const phone = WaId; // Pure number

    // 1. Find or create Customer
    // TODO: We need a Restaurant ID. For now, we'll pick the first one.
    // Assuming single restaurant for MVP context
    const { Restaurant } = await import('../../models/index.js');
    const restaurant = await Restaurant.findOne();
    if (!restaurant) throw new Error('No restaurant found');

    let customer = await Customer.findOne({ phone });

    if (!customer) {
        // Parse name from profile or default
        const fullName = ProfileName || 'Unknown WhatsApp User';
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || 'Unknown';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Extract country code from phone or default
        // WhatsApp ID format is usually "1234567890" (no +), but commonly has country code.
        // We'll set a default if we can't parse easily without libphonenumber
        const phoneCountry = 'US'; // Default or parse from phone

        customer = await Customer.create({
            phone,
            phoneCountry,
            firstName,
            lastName,
            email: undefined,
            restaurant: restaurant._id, // REQUIRED
            isVip: false,
            preferences: {}
        });
    }
    // https://timberwolf-mastiff-9776.twil.io/demo-reply
    // 2. Find active conversation (within 24h window roughly)
    // For simplicity, we get the most recent active one or create new
    let conversation = await Conversation.findOne({
        customer: customer._id,
        status: { $ne: 'resolved' }
    }).sort({ updatedAt: -1 });

    if (!conversation) {
        // Create new conversation
        // TODO: We need a Restaurant ID. For now, we'll pick the first one or need a way to route.
        // Assuming single restaurant for MVP context or getting it from env/config 
        const { Restaurant } = await import('../../models/index.js');
        const restaurant = await Restaurant.findOne();

        if (!restaurant) throw new Error('No restaurant found');

        conversation = await Conversation.create({
            customer: customer._id,
            restaurant: restaurant._id,
            status: 'ACTIVE',
            source: 'WHATSAPP',
            context: {}
        });
    }

    // 3. Store the incoming message
    await Message.create({
        content: Body,
        direction: 'INBOUND',
        sender: 'CUSTOMER',
        whatsappMsgId: data.MessageSid,
        status: 'DELIVERED',
        conversation: conversation._id
    });

    // 4. Trigger AI Agent
    // Fetch conversation history
    const history = await Message.find({ conversation: conversation._id })
        .sort({ createdAt: 1 })
        .limit(10) // Limit context window
        .select('role content sender -_id') // We need to map this to OpenAI format
        .lean();

    const formattedHistory = history.map((msg: any) => ({
        role: msg.sender === 'BOT' ? 'assistant' : 'user', // Map 'BOT' to 'assistant'
        content: msg.content,
    }));

    // Initial call to AI
    let aiResponse = await processUserMessage(Body, formattedHistory as any[]);
    let iterations = 0;
    const MAX_ITERATIONS = 3; // Prevent infinite loops

    // Loop to handle tool calls
    while (aiResponse && aiResponse.tool_calls && iterations < MAX_ITERATIONS) {
        iterations++;
        const toolCalls = aiResponse.tool_calls;
        console.log(`[AI Agent] Iteration ${iterations}: Executing ${toolCalls.length} tool(s)`);

        // Add the assistant's request (with tool calls) to history for the next turn
        formattedHistory.push(aiResponse as any);

        for (const toolCall of toolCalls) {
            try {
                const args = JSON.parse(toolCall.function.arguments);
                const result = await executeTool(toolCall.function.name, args);

                // Add tool result to history
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

        // Call AI again with tool results
        aiResponse = await processUserMessage('', formattedHistory as any);
    }

    // 5. Send Final Response
    if (aiResponse && aiResponse.content) {
        await sendWhatsAppMessage(From, aiResponse.content);

        await Message.create({
            content: aiResponse.content,
            direction: 'OUTBOUND',
            sender: 'BOT',
            status: 'SENT',
            conversation: conversation._id
        });
    }
}

// Helper to send message
export async function sendWhatsAppMessage(to: string, body: string) {
    if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_WHATSAPP_NUMBER) {
        try {
            const client = require('twilio')(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
            await client.messages.create({
                body,
                from: env.TWILIO_WHATSAPP_NUMBER,
                to
            });
            console.log(`[WHATSAPP OUTBOUND] Sent to ${to}`);
            return;
        } catch (error) {
            console.error('[WHATSAPP ERROR] Failed to send message:', error);
            // Fallback to log
        }
    }

    console.log(`[WHATSAPP OUTBOUND SIMULATION] To: ${to}, Body: ${body}`);
}
