import api from '../api';

export interface DashboardStats {
    kpi: {
        totalReservations: number;
        totalCovers: number;
        cancellationRate: number;
        activeReservations: number;
    };
    charts: {
        bookingTrends: Array<{ date: string; reservations: number; covers: number }>;
        reservationsBySource: Array<{ name: string; value: number }>;
        reservationsByStatus: Array<{ name: string; value: number }>;
        popularTimes: Array<{ time: string; value: number }>;
    };
}

export const AnalyticsService = {
    getStats: async (days: number = 30): Promise<DashboardStats> => {
        const { data } = await api.get(`/analytics/stats`, {
            params: { days },
        });
        return data;
    },
};
