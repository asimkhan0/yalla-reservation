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

// Type for restaurant info passed to the agent
export interface RestaurantInfo {
    id: string;
    name: string;
    description?: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    country: string;
    website?: string;
    cuisine: string[];
    operatingHours?: {
        [key: string]: {
            open?: string;
            close?: string;
            closed?: boolean;
        }
    };
    aiPrompt?: string;
    additionalContext?: string;
}

// Generate dynamic system prompt based on restaurant info
function generateSystemPrompt(restaurant: RestaurantInfo): string {
    // Format operating hours
    const formatHours = () => {
        if (!restaurant.operatingHours) return 'Hours not configured';

        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const hoursLines: string[] = [];

        for (const day of days) {
            const hours = restaurant.operatingHours[day];
            if (!hours) continue;

            const dayName = day.charAt(0).toUpperCase() + day.slice(1);
            if (hours.closed) {
                hoursLines.push(`${dayName}: Closed`);
            } else if (hours.open && hours.close) {
                hoursLines.push(`${dayName}: ${hours.open} - ${hours.close}`);
            }
        }

        return hoursLines.length > 0 ? hoursLines.join('\n') : 'Hours not configured';
    };

    const customPrompt = restaurant.aiPrompt || '';
    const additionalContext = restaurant.additionalContext || '';

    return `
You are a helpful restaurant reservation assistant for "${restaurant.name}".
Your goal is to help customers make reservations, answer questions about the restaurant, and handle cancellations.

Current Date: ${new Date().toISOString()}

Restaurant Information:
- Name: ${restaurant.name}
- Description: ${restaurant.description || 'No description available'}
- Address: ${restaurant.address}, ${restaurant.city}, ${restaurant.state}, ${restaurant.country}
- Phone: ${restaurant.phone}
- Email: ${restaurant.email}
- Website: ${restaurant.website || 'Not available'}
- Cuisine: ${restaurant.cuisine.length > 0 ? restaurant.cuisine.join(', ') : 'Not specified'}

Operating Hours:
${formatHours()}

${customPrompt ? `Custom Instructions:\n${customPrompt}\n` : ''}
${additionalContext ? `Additional Context:\n${additionalContext}\n` : ''}

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
5. **Restaurant Info**:
   - When asked about hours, location, contact info, or other restaurant details, use the information provided above.
   - If you need more specific information not in your context, use the 'getRestaurantInfo' tool.
6. If the user wants to speak to a human or you are stuck, use 'requestHumanTakeover'.

Style:
- Use emojis sparingly.
- Keep responses under 3 sentences when possible.
`;
}

// Tool definitions for the LLM
const getToolDefinitions = () => [
    {
        type: 'function' as const,
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
        type: 'function' as const,
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
    {
        type: 'function' as const,
        function: {
            name: 'getRestaurantInfo',
            description: 'Get detailed information about the restaurant including menu, special services, or policies not in the base context.',
            parameters: {
                type: 'object',
                properties: {
                    infoType: {
                        type: 'string',
                        description: 'Type of info needed: hours, location, contact, services, policies, or general',
                        enum: ['hours', 'location', 'contact', 'services', 'policies', 'general']
                    },
                },
                required: ['infoType'],
            },
        },
    },
];

export async function processUserMessage(
    userMessage: string,
    history: { role: 'user' | 'assistant' | 'system'; content: string }[],
    restaurant: RestaurantInfo
): Promise<any> {
    try {
        const systemPrompt = generateSystemPrompt(restaurant);

        const messages: any[] = [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: userMessage },
        ];

        const completion = await openai.chat.completions.create({
            model: env.LLM_MODEL,
            messages,
            tools: getToolDefinitions(),
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

