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
        <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
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
