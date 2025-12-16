import { Conversation, Message } from '../../models/index.js';

export const listConversations = async (restaurantId: string) => {
    // Get conversations, most recent updated first
    // @ts-ignore
    const conversations = await Conversation.find({
        restaurant: restaurantId,
        status: { $ne: 'ARCHIVED' }
    })
        .sort({ updatedAt: -1 })
        .populate('customer')
        .limit(50) as any[]; // Limit for now

    // For each conversation, get the last message
    const populated = await Promise.all(conversations.map(async (conv: any) => {
        // @ts-ignore
        const lastMessage = await Message.findOne({ conversation: conv._id })
            .sort({ createdAt: -1 });

        return {
            ...(conv.toObject ? conv.toObject() : conv),
            lastMessage
        };
    }));

    return populated;
};

export const getConversationMessages = async (conversationId: string) => {
    // @ts-ignore
    return Message.find({ conversation: conversationId })
        .sort({ createdAt: 1 }); // Oldest first for chat history
};

export const getConversation = async (conversationId: string, restaurantId: string) => {
    // @ts-ignore
    return Conversation.findOne({ _id: conversationId, restaurant: restaurantId })
        .populate('customer') as any;
};

export const assignConversation = async (conversationId: string, assignedTo: 'BOT' | 'AGENT') => {
    // @ts-ignore
    return Conversation.findByIdAndUpdate(
        conversationId,
        { assignedTo },
        { new: true }
    );
};
