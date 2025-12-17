import { Message, Conversation, Customer } from '../../models/index.js';
import { env } from '../../config/env.js';
import { processUserMessage } from './agent.service.js';
import { executeTool, getRestaurantInfoForAgent } from './tools.service.js';
import twilio from 'twilio';

interface TwilioMessage {
    Body: string;
    From: string; // "whatsapp:+1234567890"
    To: string;   // "whatsapp:+1987654321" (Restaurant Number)
    WaId: string; // "1234567890"
    ProfileName?: string;
    MessageSid: string;
}

export async function handleIncomingMessage(data: TwilioMessage) {
    const { WaId, Body, ProfileName, From, To } = data;
    const phone = WaId; // Pure number user phone

    // 1. Find the Restaurant this message is intended for
    const { Restaurant } = await import('../../models/index.js');

    // Try to find restaurant by matching the 'To' number (e.g. whatsapp:+1555...)
    // If not found, fall back to the first one (legacy logic) or error out.
    let restaurant = await Restaurant.findOne({ whatsappNumber: To });

    if (!restaurant) {
        console.warn(`[WhatsApp] No restaurant found for number ${To}. Falling back to first found.`);
        restaurant = await Restaurant.findOne();
    }

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
    let conversation = await (Conversation as any).findOne({
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

        conversation = await (Conversation as any).create({
            customer: customer._id,
            restaurant: restaurant._id,
            status: 'ACTIVE',
            source: 'WHATSAPP',
            context: {}
        });
    }

    // 3. Store the incoming message
    const currentMessage = await (Message as any).create({
        content: Body,
        direction: 'INBOUND',
        sender: 'CUSTOMER',
        whatsappMsgId: data.MessageSid,
        status: 'DELIVERED',
        conversation: conversation._id
    });

    if (conversation.assignedTo === 'AGENT') {
        console.log(`[WhatsApp] Conversation ${conversation._id} assigned to AGENT. Bot skipping.`);
        return;
    }

    // 4. Trigger AI Agent
    // Fetch conversation history (Get NEWEST 10, excluding the one we just saved)
    const rawHistory = await (Message as any).find({
        conversation: conversation._id,
        _id: { $ne: currentMessage._id }
    })
        .sort({ createdAt: -1 }) // Newest first
        .limit(10) // Limit context window
        .select('role content sender -_id')
        .lean();

    // Reverse to be chronological (Oldest -> Newest)
    const history = rawHistory.reverse();

    const formattedHistory = history.map((msg: any) => ({
        role: msg.sender === 'BOT' ? 'assistant' : 'user',
        content: msg.content,
    }));

    // Get restaurant info for agent context (cached)
    const restaurantInfo = await getRestaurantInfoForAgent();
    if (!restaurantInfo) {
        console.error('[WhatsApp] No restaurant info available for agent');
        return;
    }

    // Initial call to AI
    let aiResponse = await processUserMessage(Body, formattedHistory as any[], restaurantInfo);
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
        aiResponse = await processUserMessage('', formattedHistory as any, restaurantInfo);
    }

    // 5. Send Final Response
    if (aiResponse && aiResponse.content) {
        await sendWhatsAppMessage(From, aiResponse.content);

        await (Message as any).create({
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
            // Dynamic import to avoid top-level dependency issues if envs are missing
            // const { default: twilio } = await import('twilio');
            const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

            // Ensure numbers have whatsapp: prefix
            const fromNumber = env.TWILIO_WHATSAPP_NUMBER.startsWith('whatsapp:')
                ? env.TWILIO_WHATSAPP_NUMBER
                : `whatsapp:${env.TWILIO_WHATSAPP_NUMBER}`;

            const toNumber = to.startsWith('whatsapp:')
                ? to
                : `whatsapp:${to}`;

            await client.messages.create({
                body,
                from: fromNumber,
                to: toNumber
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
