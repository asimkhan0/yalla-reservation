"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Users, MessageSquare, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Stat card component
function StatCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
}: {
    title: string;
    value: string | number;
    description: string;
    icon: React.ElementType;
    trend?: { value: number; positive: boolean };
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                    {trend && (
                        <span
                            className={cn(
                                "mr-1",
                                trend.positive ? "text-green-600" : "text-red-600"
                            )}
                        >
                            {trend.positive ? "+" : ""}{trend.value}%
                        </span>
                    )}
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}

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

                // 3. Fetch Active Chats (Optional/Placeholder for now)
                // const chatsRes = await fetch("http://localhost:3001/api/conversations?status=ACTIVE", { headers });
                // if (chatsRes.ok) { ... }

            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const today = formatDate(new Date());

    return (
        <div className="space-y-6">
            {/* Welcome header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Welcome back{user ? `, ${user.firstName}` : ""}! 👋
                </h1>
                <p className="text-muted-foreground">
                    Here's what's happening with your reservations today.
                </p>
            </div>

            {/* Stats grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Today's Reservations"
                    value={stats.todayCount}
                    description="scheduled for today"
                    icon={CalendarDays}
                />
                <StatCard
                    title="Total Covers"
                    value={stats.totalCovers}
                    description="guests expected"
                    icon={Users}
                />
                <StatCard
                    title="Active Chats"
                    value={stats.activeChats} // Placeholder
                    description="need attention"
                    icon={MessageSquare}
                />
                <StatCard
                    title="Avg. Wait Time"
                    value="--"
                    description="insufficient data"
                    icon={Clock}
                />
            </div>

            {/* Main content grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Upcoming reservations */}
                <Card className="lg:col-span-1 h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Upcoming Today</span>
                            <span className="text-sm font-normal text-muted-foreground">
                                {today}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8 text-muted-foreground">Loading...</div>
                        ) : reservations.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No reservations scheduled for today.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {reservations.slice(0, 5).map((res) => (
                                    <div
                                        key={res._id}
                                        className="flex items-center justify-between rounded-lg border p-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                                <span className="text-sm font-medium text-primary">
                                                    {res.time}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium">{res.guestName}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {res.partySize} guests
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={cn(
                                                "rounded-full px-2 py-1 text-xs font-medium",
                                                res.status === "CONFIRMED"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-amber-100 text-amber-800"
                                            )}
                                        >
                                            {res.status}
                                        </span>
                                    </div>
                                ))}
                                {reservations.length > 5 && (
                                    <div className="pt-2 text-center">
                                        <Link href="/reservations" className="text-sm text-primary hover:underline">
                                            View all {reservations.length} reservations
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick actions */}
                <Card className="lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                            <Link href="/reservations">
                                <Button variant="outline" className="w-full h-24 flex flex-col gap-2 hover:bg-muted hover:text-foreground">
                                    <CalendarDays className="h-6 w-6 text-primary" />
                                    <span className="font-medium">New Reservation</span>
                                </Button>
                            </Link>

                            <Link href="/reservations">
                                <Button variant="outline" className="w-full h-24 flex flex-col gap-2 hover:bg-muted hover:text-foreground">
                                    <Users className="h-6 w-6 text-primary" />
                                    <span className="font-medium">Add Walk-in</span>
                                </Button>
                            </Link>

                            <Link href="/conversations">
                                <Button variant="outline" className="w-full h-24 flex flex-col gap-2 hover:bg-muted hover:text-foreground">
                                    <MessageSquare className="h-6 w-6 text-primary" />
                                    <span className="font-medium">View Messages</span>
                                </Button>
                            </Link>

                            <Link href="/settings">
                                <Button variant="outline" className="w-full h-24 flex flex-col gap-2 hover:bg-muted hover:text-foreground">
                                    <Clock className="h-6 w-6 text-primary" />
                                    <span className="font-medium">Settings / Hours</span>
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
