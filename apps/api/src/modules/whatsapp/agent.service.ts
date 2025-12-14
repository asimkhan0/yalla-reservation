import OpenAI from 'openai';
import { env } from '../../config/env.js';

const getOpenAIClient = () => {
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
3. **Availability Check**:
   - If the user specifies a time, use 'checkAvailability' to verify it.
   - If the user asks "what times do you have?", use 'checkAvailability' with just the date (and party size) to get a list of slots.
   - ALWAYS offer available slots if their requested time is taken.
4. **Finalizing**:
   - ONCE availability is confirmed and you have all details (Name, Date, Time, Size), you **MUST** call the 'createReservation' tool immediately.
   - Do not ask for "confirmation" endlessly. If they said "yes book it" or provided the final missing piece, just book it.
   - After successfully booking, tell them the confirmation code.
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
                        description: 'Check table availability. Can return a specific slot status OR a list of all available slots for the day.',
                        parameters: {
                            type: 'object',
                            properties: {
                                date: { type: 'string', description: 'YYYY-MM-DD format' },
                                time: { type: 'string', description: 'HH:MM format (Optional if listing all slots)' },
                                partySize: { type: 'number' },
                            },
                            required: ['date', 'partySize'],
                        },
                    },
                },
                {
                    type: 'function',
                    function: {
                        name: 'createReservation',
                        description: 'Create a new reservation in the database. Call this ONLY when user confirms details.',
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
