"use client";

import { useEffect, useState } from "react";
import { AnalyticsService, DashboardStats } from "@/lib/services/analytics";
import { StatsCards } from "@/components/analytics/StatsCards";
import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts";
import { toast } from "sonner";

export default function AnalyticsPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await AnalyticsService.getStats(30);
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch analytics", error);
                toast.error("Failed to load analytics data");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return <div className="p-8 text-center">Loading analytics...</div>;
    }

    if (!stats) {
        return <div className="p-8 text-center">No data available</div>;
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
            </div>

            <div className="space-y-4">
                <StatsCards data={stats.kpi} />
                <AnalyticsCharts data={stats.charts} />
            </div>
        </div>
    );
}
