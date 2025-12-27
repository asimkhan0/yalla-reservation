import { describe, it, expect } from 'vitest';

// Recreate the extraction logic to test it (matches agent.service.ts)
function extractCollectedInfo(history: { role: string; content: string }[]): Record<string, string> {
    const collected: Record<string, string> = {};
    // Only look at user messages for extraction
    const userMessages = history.filter(m => m.role === 'user').map(m => m.content).join(' ');
    
    // Look for party size patterns
    const sizeMatch = userMessages.match(/(\d+)\s*(?:people|persons|guests|of us|pax)/i) 
        || userMessages.match(/(?:party of|table for|for)\s*(\d+)/i);
    if (sizeMatch?.[1]) collected.partySize = sizeMatch[1];
    
    // Look for time patterns
    const timeMatch = userMessages.match(/(?:at|around|@)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i)
        || userMessages.match(/,\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i)
        || userMessages.match(/(\d{1,2}:\d{2}\s*(?:am|pm))/i)
        || userMessages.match(/(\d{1,2}\s*(?:am|pm))/i);
    if (timeMatch?.[1]) collected.time = timeMatch[1];
    
    // Look for date patterns
    const dateMatch = userMessages.match(/\b(today|tomorrow)\b/i)
        || userMessages.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i)
        || userMessages.match(/(\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*)/i)
        || userMessages.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch?.[1]) collected.date = dateMatch[1];
    
    // Look for name patterns
    const nameMatch = userMessages.match(/(?:my name is|i'm|i am|name is|call me)\s+([A-Z][a-z]+)/i);
    if (nameMatch?.[1]) collected.guestName = nameMatch[1];
    
    // Look for phone patterns
    const phoneMatch = userMessages.match(/(?:phone|number|contact).*?(\+?\d[\d\s\-]{8,})/i)
        || userMessages.match(/(\+\d{10,15})/);
    if (phoneMatch?.[1]) collected.guestPhone = phoneMatch[1].replace(/\s/g, '');
    
    return collected;
}

describe('extractCollectedInfo', () => {
    describe('Conversation 1 - Restaurant hours inquiry', () => {
        it('should extract date and time from "tomorrow morning at around 5 AM"', () => {
            const history = [
                { role: 'user', content: 'Hi' },
                { role: 'assistant', content: 'Hello! How can I help you today?' },
                { role: 'user', content: 'Yes, can I come tomorrow morning at around 5 AM?' },
            ];
            
            const collected = extractCollectedInfo(history);
            expect(collected.date).toBe('tomorrow');
            expect(collected.time).toBe('5 AM');
        });
    });

    describe('Conversation 2 - Repeated questions scenario', () => {
        it('should extract date and time from "today, 11 pm"', () => {
            const history = [
                { role: 'user', content: 'today, 11 pm' },
                { role: 'assistant', content: 'How many people will be dining with you today at 11:00 PM?' },
            ];
            
            const collected = extractCollectedInfo(history);
            expect(collected.date).toBe('today');
            expect(collected.time).toBe('11 pm');
        });

        it('should extract party size from "X people" pattern', () => {
            const history = [
                { role: 'user', content: 'I need a table for 2 people' },
            ];
            
            const collected = extractCollectedInfo(history);
            expect(collected.partySize).toBe('2');
        });

        it('should extract name and time from complex message', () => {
            const history = [
                { role: 'user', content: 'lets do it 10 PM, my name is Atif and phone number is +923078526944' },
            ];
            
            const collected = extractCollectedInfo(history);
            expect(collected.guestName).toBe('Atif');
            expect(collected.time).toBe('10 PM');
            expect(collected.guestPhone).toBe('+923078526944');
        });

        it('should extract all info from full conversation 2', () => {
            const history = [
                { role: 'user', content: 'hi' },
                { role: 'assistant', content: 'Hello! Welcome to Asim restaurant!' },
                { role: 'user', content: 'what are the timings of restaurant for today?' },
                { role: 'assistant', content: 'We are open today until 10:00 PM. Would you like to make a reservation?' },
                { role: 'user', content: 'today, 11 pm' },
                { role: 'assistant', content: 'How many people will be dining?' },
                { role: 'user', content: 'for 2 people' },
                { role: 'assistant', content: '11:00 PM isnt available. We have 9:00 PM, 9:30 PM, 10:00 PM' },
                { role: 'user', content: 'lets do it 10 PM, my name is Atif and phone number is +923078526944' },
            ];
            
            const collected = extractCollectedInfo(history);
            
            expect(collected.date).toBe('today');
            expect(collected.guestName).toBe('Atif');
            expect(collected.partySize).toBe('2');
            expect(collected.guestPhone).toBe('+923078526944');
        });

        it('should extract name even when AI asks again (the bug scenario)', () => {
            const history = [
                { role: 'user', content: 'today, 11 pm' },
                { role: 'assistant', content: 'How many people?' },
                { role: 'user', content: 'for 2 people' },
                { role: 'assistant', content: '11 PM not available. Try 9 PM?' },
                { role: 'user', content: 'my name is Atif' },
                { role: 'assistant', content: 'Whats your name?' }, // AI repeated the question!
                { role: 'user', content: 'I already gave' },
            ];
            
            const collected = extractCollectedInfo(history);
            
            // Name should still be extracted from earlier message
            expect(collected.guestName).toBe('Atif');
            expect(collected.date).toBe('today');
            expect(collected.partySize).toBe('2');
        });
    });

    describe('Edge cases', () => {
        it('should handle empty history', () => {
            const collected = extractCollectedInfo([]);
            expect(Object.keys(collected).length).toBe(0);
        });

        it('should extract time with various formats', () => {
            expect(extractCollectedInfo([{ role: 'user', content: 'at 7pm' }]).time).toBe('7pm');
            expect(extractCollectedInfo([{ role: 'user', content: 'around 7:30 PM' }]).time).toBe('7:30 PM');
        });

        it('should extract date with various formats', () => {
            expect(extractCollectedInfo([{ role: 'user', content: 'today please' }]).date).toBe('today');
            expect(extractCollectedInfo([{ role: 'user', content: 'tomorrow' }]).date).toBe('tomorrow');
            expect(extractCollectedInfo([{ role: 'user', content: 'on Monday' }]).date).toBe('Monday');
        });

        it('should extract party size with various patterns', () => {
            expect(extractCollectedInfo([{ role: 'user', content: '4 people' }]).partySize).toBe('4');
            expect(extractCollectedInfo([{ role: 'user', content: 'table for 6' }]).partySize).toBe('6');
            expect(extractCollectedInfo([{ role: 'user', content: 'party of 8' }]).partySize).toBe('8');
        });

        it('should only extract from user messages, not assistant', () => {
            const history = [
                { role: 'assistant', content: 'We are open today until 10:00 PM' },
                { role: 'user', content: 'ok' },
            ];
            
            const collected = extractCollectedInfo(history);
            // Should NOT extract "today" from assistant message
            expect(collected.date).toBeUndefined();
        });
    });
});
