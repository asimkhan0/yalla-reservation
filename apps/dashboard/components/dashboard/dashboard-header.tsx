import { formatDate } from "@/lib/utils";

interface DashboardHeaderProps {
    firstName?: string;
}

export function DashboardHeader({ firstName }: DashboardHeaderProps) {
    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight">
                Welcome back{firstName ? `, ${firstName}` : ""}! 👋
            </h1>
            <p className="text-muted-foreground">
                Here's what's happening with your reservations today.
            </p>
        </div>
    );
}
