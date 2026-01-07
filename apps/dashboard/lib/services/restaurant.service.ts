import api from '../api';

export interface WhatsAppConfig {
    provider: 'twilio' | 'meta';
    enabled: boolean;
    // Twilio
    accountSid?: string;
    authToken?: string;
    phoneNumber?: string;
    // Meta
    phoneNumberId?: string;
    wabaId?: string;
    accessToken?: string;
    webhookVerifyToken?: string;
    // Display info (populated after connection)
    businessName?: string;
    displayPhoneNumber?: string;
}

export const RestaurantService = {
    updateIntegration: async (restaurantId: string, config: WhatsAppConfig) => {
        // We map the flat config to the nested structure if needed, or send as is
        // The backend schema expects a discriminated union.
        // Let's ensure we send exactly what the schema needs.

        let payload: any = {
            enabled: config.enabled,
            provider: config.provider
        };

        if (config.provider === 'twilio') {
            payload = {
                ...payload,
                accountSid: config.accountSid,
                authToken: config.authToken,
                phoneNumber: config.phoneNumber
            };
        } else if (config.provider === 'meta') {
            payload = {
                ...payload,
                phoneNumberId: config.phoneNumberId,
                wabaId: config.wabaId,
                accessToken: config.accessToken,
                businessName: config.businessName,
                displayPhoneNumber: config.displayPhoneNumber
            };
        }

        const response = await api.patch(`/restaurants/me`, {
            whatsappConfig: payload
        });
        return response.data;
    },

    disconnect: async (restaurantId: string) => {
        const response = await api.patch(`/restaurants/me`, {
            whatsappConfig: null,
            whatsappEnabled: false
        });
        return response.data;
    },

    testConnection: async (restaurantId: string, message: string, phoneNumber: string) => {
        const response = await api.post(`/whatsapp/chat-test`, {
            restaurantId,
            message,
            phoneNumber // The user's phone number to send to
        });
        return response.data;
    },

    verifyMetaConnection: async (phoneNumberId: string, accessToken: string) => {
        const response = await api.post(`/whatsapp/verify-meta-connection`, {
            phoneNumberId,
            accessToken
        });
        return response.data as {
            valid: boolean;
            displayPhoneNumber?: string;
            verifiedName?: string;
            qualityRating?: string;
            error?: string;
        };
    }
};

