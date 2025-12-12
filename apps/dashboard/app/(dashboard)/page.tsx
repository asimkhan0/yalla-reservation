"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Users, MessageSquare, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";

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

// Sample upcoming reservations
const upcomingReservations = [
    { id: 1, name: "John Smith", time: "18:00", partySize: 4, status: "CONFIRMED" },
    { id: 2, name: "Sarah Johnson", time: "18:30", partySize: 2, status: "PENDING" },
    { id: 3, name: "Michael Brown", time: "19:00", partySize: 6, status: "CONFIRMED" },
    { id: 4, name: "Emily Davis", time: "19:30", partySize: 3, status: "CONFIRMED" },
    { id: 5, name: "David Wilson", time: "20:00", partySize: 2, status: "PENDING" },
];

export default function DashboardPage() {
    const [restaurant, setRestaurant] = useState<{ name: string } | null>(null);

    useEffect(() => {
        const storedRestaurant = localStorage.getItem("restaurant");
        if (storedRestaurant) setRestaurant(JSON.parse(storedRestaurant));
    }, []);

    const today = formatDate(new Date());

    return (
        <div className="space-y-6">
            {/* Welcome header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Welcome back{restaurant ? `, ${restaurant.name}` : ""}! 👋
                </h1>
                <p className="text-muted-foreground">
                    Here's what's happening with your reservations today.
                </p>
            </div>

            {/* Stats grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Today's Reservations"
                    value={12}
                    description="vs yesterday"
                    icon={CalendarDays}
                    trend={{ value: 15, positive: true }}
                />
                <StatCard
                    title="Total Covers"
                    value={45}
                    description="guests expected"
                    icon={Users}
                />
                <StatCard
                    title="Active Chats"
                    value={3}
                    description="need attention"
                    icon={MessageSquare}
                />
                <StatCard
                    title="Avg. Wait Time"
                    value="12m"
                    description="response time"
                    icon={Clock}
                />
            </div>

            {/* Main content grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Upcoming reservations */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Upcoming Today</span>
                            <span className="text-sm font-normal text-muted-foreground">
                                {today}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {upcomingReservations.map((res) => (
                                <div
                                    key={res.id}
                                    className="flex items-center justify-between rounded-lg border p-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                            <span className="text-sm font-medium text-primary">
                                                {res.time}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium">{res.name}</p>
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
                        </div>
                    </CardContent>
                </Card>

                {/* Quick actions / Recent activity */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="flex flex-col items-center justify-center rounded-lg border p-4 transition-colors hover:bg-muted">
                                <CalendarDays className="mb-2 h-6 w-6 text-primary" />
                                <span className="text-sm font-medium">New Reservation</span>
                            </button>
                            <button className="flex flex-col items-center justify-center rounded-lg border p-4 transition-colors hover:bg-muted">
                                <Users className="mb-2 h-6 w-6 text-primary" />
                                <span className="text-sm font-medium">Add Walk-in</span>
                            </button>
                            <button className="flex flex-col items-center justify-center rounded-lg border p-4 transition-colors hover:bg-muted">
                                <MessageSquare className="mb-2 h-6 w-6 text-primary" />
                                <span className="text-sm font-medium">View Messages</span>
                            </button>
                            <button className="flex flex-col items-center justify-center rounded-lg border p-4 transition-colors hover:bg-muted">
                                <Clock className="mb-2 h-6 w-6 text-primary" />
                                <span className="text-sm font-medium">Manage Waitlist</span>
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
