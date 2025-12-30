import mongoose from 'mongoose';
import { Conversation, Message } from '../../models/index.js';
import { sendWhatsAppMessage } from '../whatsapp/whatsapp.service.js';

export const listConversations = async (restaurantId: string) => {
    // Get conversations, most recent updated first
    const conversations = await Conversation.find({
        restaurant: restaurantId,
        status: { $ne: 'ARCHIVED' }
    })
        .sort({ updatedAt: -1 })
        .populate('customer')
        .limit(50)
        .lean();

    // For each conversation, get the last message
    const populated = await Promise.all(conversations.map(async (conv: any) => {
        const lastMessage = await Message.findOne({ conversation: conv._id })
            .sort({ createdAt: -1 });

        return {
            ...conv,
            lastMessage
        };
    }));

    return populated;
};

export const getConversationMessages = async (conversationId: string) => {
    // Reset unread count when messages are requested (opening conversation)
    await Conversation.findByIdAndUpdate(conversationId, { unreadCount: 0 });

    return Message.find({ conversation: conversationId })
        .sort({ createdAt: 1 }); // Oldest first for chat history
};

export const getUnreadConversationCount = async (restaurantId: string) => {
    const result = await Conversation.aggregate([
        { $match: { restaurant: new mongoose.Types.ObjectId(restaurantId), unreadCount: { $gt: 0 } } },
        { $count: "count" }
    ]);
    return result[0]?.count || 0;
};

export const getConversation = async (conversationId: string, restaurantId: string) => {
    return Conversation.findOne({ _id: conversationId, restaurant: restaurantId })
        .populate('customer');
};

export const assignConversation = async (conversationId: string, assignedTo: 'BOT' | 'AGENT') => {
    return Conversation.findByIdAndUpdate(
        conversationId,
        { assignedTo },
        { new: true }
    );
};

export const sendAgentMessage = async (conversationId: string, content: string) => {
    // 1. Get Conversation to find Customer phone
    const conversation = await Conversation.findById(conversationId).populate('customer');
    if (!conversation) throw new Error('Conversation not found');

    // 2. Save Message to DB
    const message = await Message.create({
        content,
        direction: 'OUTBOUND',
        sender: 'AGENT',
        status: 'SENT',
        conversation: conversationId
    });

    // Update conversation timestamp
    await Conversation.findByIdAndUpdate(conversationId, { updatedAt: new Date() });

    // 3. Send via WhatsApp
    if (conversation.customer && (conversation.customer as any).phone) {
        await sendWhatsAppMessage(conversation.customer._id.toString(), (conversation.customer as any).phone, content);
    }

    return message;
};
