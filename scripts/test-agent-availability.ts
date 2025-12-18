
import { processUserMessage, RestaurantInfo } from '../apps/api/src/modules/whatsapp/agent.service';
import { getRestaurantInfoForAgent } from '../apps/api/src/modules/whatsapp/tools.service';
import dotenv from 'dotenv';
import path from 'path';

// Load env from apps/api
dotenv.config({ path: path.resolve(__dirname, '../apps/api/.env') });

async function run() {
    console.log('--- Starting Agent Availability Test ---');

    // 1. Get Restaurant context
    const restaurant = await getRestaurantInfoForAgent();
    if (!restaurant) {
        console.error('❌ No restaurant configured via getRestaurantInfoForAgent');
        process.exit(1);
    }
    console.log(`✅ Loaded restaurant: ${restaurant.name}`);

    // Override operating hours/cache if needed? 
    // Actually, getRestaurantInfoForAgent reads real DB or cache. 
    // We'll trust the dev environment has a restaurant.

    // 2. Simulate User Message
    const userMessage = "List all the availabilities for today";
    console.log(`\n👤 User: "${userMessage}"`);

    try {
        const response = await processUserMessage(
            userMessage,
            [], // Empty history
            restaurant
        );

        console.log(`\n🤖 Agent: "${response.content}"`);

        if (response.tool_calls) {
            console.log('🛠️ Agent wants to call tools:', JSON.stringify(response.tool_calls, null, 2));
            // Note: In real flow, we'd execute tool and loop back. 
            // Here we just want to see if the INITIAL response is better or if it calls the right tool.
            // Wait, if it *calls* the tool, we won't see the text list yet.
            // The agent typically:
            // 1. Calls checkAvailability
            // 2. Gets result
            // 3. Generates text

            // So simply calling processUserMessage once might just return the tool call.
            // We need to simulate the loop if we want to see the final text.
        }

    } catch (e: any) {
        console.error('Error processing message:', e.message);
    }
}

// Minimal loop simulation
async function runFullLoop() {
    console.log('\n--- Running Full Loop Test ---');

    const restaurant = await getRestaurantInfoForAgent();
    if (!restaurant) return;

    const userMessage = "List all the availabilities for today";
    const history = [];

    // Step 1: User asks
    let response = await processUserMessage(userMessage, history, restaurant);

    // Step 2: Handle Tool Calls
    if (response.tool_calls) {
        console.log('Step 1 response is tool call(s). Executing...');
        const { executeTool } = await import('../apps/api/src/modules/whatsapp/tools.service');

        history.push({ role: 'user', content: userMessage });
        history.push(response); // Add assistant's tool call message

        for (const toolCall of response.tool_calls) {
            const result = await executeTool(toolCall.function.name, JSON.parse(toolCall.function.arguments));
            console.log(`Tool ${toolCall.function.name} output keys:`, Object.keys(result));

            history.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(result)
            });
        }

        // Step 3: Get final answer
        const finalResponse = await processUserMessage(
            // We don't pass a new user message, we just continue conversation?
            // Actually currently processUserMessage appends the userMessage to history.
            // If we just want to continue, we pass null? Or we need to restructure how we call it.
            // Looking at agent.service.ts, processUserMessage takes `userMessage` and appends it.
            // If we want to continue after tool outputs, we shouldn't append user message again.
            // But processUserMessage API is: (userMessage, history, restaurant) -> appends userMessage.

            // Hack: Pass empty string or handle logic?
            // Actually, normally the controller handles the loop. 
            // Let's look at `agent.service.ts` again. It constructs messages = [system, ...history, { user, content: userMessage }].
            // So if we simply pass "" as userMessage, it adds an empty user message? That might confuse the LLM.
            // We arguably need to change processUserMessage slightly to support "continue generation" without new user input, 
            // OR we just assume the controller passes the whole history including the user message as the last item?
            // No, the controller appends the newest user message. 

            // Let's just simulate manually here by calling openai directly for the second step, OR
            // we accept that we just want to verify logic.
            // Actually, `processUserMessage` is designed for single-turn-ish or user-initiated turn.
            // If the tool returns data, we need 1 more generation. Re-calling processUserMessage with "continue" or "generate response based on tool outputs" 
            // as user message might work, but is hacky.

            // Better: Just verify the prompt update instructions and assume the standard loop works?
            // No, I want to see the text.
            // I'll manually call openai for the second step in this script.
            "", // dummy
            history as any,
            restaurant
        );

        // Actually, if I pass "", it adds user: "" at the end. 
        // We'll modify the script to call openai directly for step 2.
    } else {
        console.log('Step 1 response:', response.content);
    }
}

// We need to export verify loop logic properly.
// For now let's just use `processUserMessage` and if it is restricted, we'll see.
// `processUserMessage` is hardcoded to add the user message.
// Let's rebuild the loop in the script.

import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); // Need to ensure key is loaded

// run(); 
// We will write a better script that imports the internal generation logic or duplicates it slightly for test.
