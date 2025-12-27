import { create } from 'zustand';
import api from '@/lib/api';

interface Location {
    address?: string;
    googleMapsUrl?: string;
}

interface OperatingHours {
    open?: string;
    close?: string;
    closed?: boolean;
}

interface Service {
    name: string;
    description?: string;
    duration: number[];
    price?: number;
}

interface Restaurant {
    _id: string;
    name: string;
    description?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    logo?: string;
    whatsappNumber?: string;
    whatsappConfig?: {
        enabled: boolean;
        provider?: 'twilio' | 'meta';
        // Twilio specific fields
        accountSid?: string;
        authToken?: string;
        phoneNumber?: string;
        webhookUrl?: string;
        // Meta specific fields
        phoneNumberId?: string;
        wabaId?: string;
        accessToken?: string;
        webhookVerifyToken?: string;
    };
    aiPrompt?: string;
    additionalContext?: string;
    location?: Location;
    operatingHours?: Record<string, OperatingHours>;
    services?: Service[];
}

interface RestaurantState {
    restaurant: Restaurant | null;
    isLoading: boolean;
    error: string | null;
    fetchRestaurant: () => Promise<void>;
    updateRestaurant: (data: Partial<Restaurant>) => Promise<void>;
    reset: () => void;
}

export const useRestaurantStore = create<RestaurantState>((set) => ({
    restaurant: null,
    isLoading: false,
    error: null,

    reset: () => set({ restaurant: null, isLoading: false, error: null }),

    fetchRestaurant: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data } = await api.get('/restaurants/me');
            set({ restaurant: data, isLoading: false });
        } catch (error: any) {
            console.error('Failed to fetch restaurant:', error);
            set({
                error: error.response?.data?.message || 'Failed to fetch restaurant details',
                isLoading: false
            });
        }
    },

    updateRestaurant: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const { data: updatedRestaurant } = await api.patch('/restaurants/me', data);
            set({ restaurant: updatedRestaurant, isLoading: false });
        } catch (error: any) {
            console.error('Failed to update restaurant:', error);
            set({
                error: error.response?.data?.message || 'Failed to update restaurant',
                isLoading: false
            });
            throw error;
        }
    },
}));
