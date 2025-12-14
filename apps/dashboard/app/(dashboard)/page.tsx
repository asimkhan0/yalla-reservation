"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { UpcomingReservations } from "@/components/dashboard/upcoming-reservations";
import { QuickActions } from "@/components/dashboard/quick-actions";


export default function DashboardPage() {
    const [user, setUser] = useState<{ firstName: string } | null>(null);
    const [reservations, setReservations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        todayCount: 0,
        totalCovers: 0,
        activeChats: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("accessToken");
                if (!token) return;

                const headers = { Authorization: `Bearer ${token}` };

                // 1. Fetch User
                const userRes = await fetch("http://localhost:3001/api/auth/me", { headers });
                if (userRes.ok) {
                    const userData = await userRes.json();
                    setUser(userData);
                }

                // 2. Fetch Reservations for Today
                const todayStr = new Date().toISOString().split('T')[0];
                const resRes = await fetch(`http://localhost:3001/api/reservations?date=${todayStr}`, { headers });

                if (resRes.ok) {
                    const resData = await resRes.json();
                    const todays = resData.reservations || [];
                    setReservations(todays);

                    // Calc stats
                    const covers = todays.reduce((acc: number, r: any) => acc + (r.partySize || 0), 0);
                    setStats(prev => ({ ...prev, todayCount: todays.length, totalCovers: covers }));
                }

            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);


    return (
        <div className="space-y-6">
            <DashboardHeader firstName={user?.firstName} />
            <StatsGrid stats={stats} />
            <div className="grid gap-6 lg:grid-cols-2">
                <UpcomingReservations reservations={reservations} loading={loading} />
                <QuickActions />
            </div>
        </div>
    );
}
