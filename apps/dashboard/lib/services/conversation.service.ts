import api from '../api';

export const ConversationService = {
    /**
     * Get unread conversations count
     */
    async getUnreadCount(): Promise<number> {
        try {
            const { data } = await api.get('/conversations/unread-count');
            return data.unreadCount || 0;
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
            return 0;
        }
    },

    /**
     * List conversations for the restaurant
     */
    async listConversations() {
        const { data } = await api.get('/conversations');
        return data.conversations;
    },

    /**
     * Get messages for a specific conversation
     */
    async getMessages(conversationId: string) {
        const { data } = await api.get(`/conversations/${conversationId}/messages`);
        return data.messages;
    }
};
