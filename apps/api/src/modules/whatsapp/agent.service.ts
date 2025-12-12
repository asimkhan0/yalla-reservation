import OpenAI from 'openai';
import { env } from '../../config/env.js';

const getOpenAIClient = () => {
    debugger
    console.log('asim', env.LLM_PROVIDER)
    if (env.LLM_PROVIDER === 'deepseek') {
        if (!env.DEEPSEEK_API_KEY) throw new Error('DEEPSEEK_API_KEY is missing');
        return new OpenAI({
            baseURL: 'https://api.deepseek.com',
            apiKey: env.DEEPSEEK_API_KEY,
        });
    }

    // Default to OpenAI
    if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is missing');
    return new OpenAI({
        apiKey: env.OPENAI_API_KEY,
    });
};

const openai = getOpenAIClient();

// System prompt for the reservation agent
const SYSTEM_PROMPT = `
You are a helpful restaurant reservation assistant for "Yalla".
Your goal is to help customers make reservations, answer questions about the restaurant, and handle cancellations.

Current Date: ${new Date().toISOString()}

Rules:
1. Be friendly, professional, and concise (WhatsApp messages should be short).
2. To make a reservation, you MUST collect: Name, Date, Time, and Party Size.
3. Use the 'checkAvailability' tool to see if a slot is open BEFORE confirming.
4. Use the 'createReservation' tool ONLY after the user confirms the details and you've verified availability.
5. If the user asks about the menu or hours, answer based on your knowledge (Hours: 5pm-11pm daily).
6. If the user wants to speak to a human or you are stuck, use 'requestHumanTakeover'.

Style:
- Use emojis sparingly.
- Keep responses under 3 sentences when possible.
`;

export async function processUserMessage(
    userMessage: string,
    history: { role: 'user' | 'assistant' | 'system'; content: string }[]
): Promise<any> {
    try {
        const messages: any[] = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history,
            { role: 'user', content: userMessage },
        ];

        const completion = await openai.chat.completions.create({
            model: env.LLM_MODEL,
            messages,
            tools: [
                {
                    type: 'function',
                    function: {
                        name: 'checkAvailability',
                        description: 'Check if a table is available for a given date, time, and party size',
                        parameters: {
                            type: 'object',
                            properties: {
                                date: { type: 'string', description: 'YYYY-MM-DD format' },
                                time: { type: 'string', description: 'HH:MM format' },
                                partySize: { type: 'number' },
                            },
                            required: ['date', 'time', 'partySize'],
                        },
                    },
                },
                {
                    type: 'function',
                    function: {
                        name: 'createReservation',
                        description: 'Create a new reservation after confirming availability',
                        parameters: {
                            type: 'object',
                            properties: {
                                date: { type: 'string', description: 'YYYY-MM-DD format' },
                                time: { type: 'string', description: 'HH:MM format' },
                                partySize: { type: 'number' },
                                guestName: { type: 'string' },
                                guestPhone: { type: 'string' },
                                specialRequests: { type: 'string' },
                            },
                            required: ['date', 'time', 'partySize', 'guestName', 'guestPhone'],
                        },
                    },
                },
            ],
            tool_choice: 'auto',
        });

        const choice = completion.choices[0];
        if (!choice) {
            throw new Error('No completion choices returned from OpenAI');
        }
        return choice.message;
    } catch (error) {
        console.error('OpenAI Error:', error);
        return { content: "I'm having trouble connecting right now. Please try again later.", role: 'assistant' };
    }
}
