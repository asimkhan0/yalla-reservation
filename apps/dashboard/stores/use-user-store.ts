import { create } from 'zustand';
import api from '@/lib/api';

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

interface UserState {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    fetchUser: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
    user: null,
    isLoading: false,
    error: null,

    fetchUser: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data } = await api.get('/auth/me');
            set({ user: data, isLoading: false });
        } catch (error: any) {
            console.error('Failed to fetch user:', error);
            set({
                error: error.response?.data?.message || 'Failed to fetch user details',
                isLoading: false
            });
        }
    },
}));
