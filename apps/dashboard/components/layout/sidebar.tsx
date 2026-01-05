"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    CalendarDays,
    MessageSquare,
    Users,
    BarChart3,
    Settings,
    LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clearAuthCookies } from "@/lib/cookies";
import { useRestaurantStore } from "@/stores/use-restaurant-store";
import { Logo } from "@/components/logo";

const navigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Reservations", href: "/reservations", icon: CalendarDays },
    { name: "Conversations", href: "/conversations", icon: MessageSquare },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const resetRestaurantStore = useRestaurantStore((state) => state.reset);

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        localStorage.removeItem("restaurant");
        clearAuthCookies();
        resetRestaurantStore();
        router.push("/login");
    };

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border/50 bg-gradient-to-b from-card to-background">
            <div className="flex h-full flex-col">
                {/* Logo */}
                <div className="flex h-16 items-center justify-center border-b border-border/50 px-4">
                    <Logo className="max-h-full w-auto" />
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 px-3 py-4">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <item.icon className={cn(
                                    "h-5 w-5 transition-colors",
                                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                                )} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="border-t border-border/50 p-3">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
                    >
                        <LogOut className="h-5 w-5" />
                        Sign out
                    </button>
                </div>
            </div>
        </aside>
    );
}
