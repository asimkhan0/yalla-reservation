import { CalendarDays, Users, MessageSquare, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string | number;
    description: string;
    icon: React.ElementType;
    trend?: { value: number; positive: boolean };
}

function StatCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
}: StatCardProps) {
    return (
        <Card className="group hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className="rounded-lg bg-primary/10 p-2 transition-colors group-hover:bg-primary/15">
                    <Icon className="h-4 w-4 text-primary" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold tracking-tight">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                    {trend && (
                        <span
                            className={cn(
                                "mr-1 font-medium",
                                trend.positive ? "text-emerald-400" : "text-red-400"
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

interface StatsGridProps {
    stats: {
        todayCount: number;
        totalCovers: number;
        activeChats: number;
    };
}

export function StatsGrid({ stats }: StatsGridProps) {
    return (
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
                value={stats.activeChats}
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
    );
}
