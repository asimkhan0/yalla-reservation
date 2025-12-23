"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Search } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConversationService } from "@/lib/services/conversation.service";
import { ModeToggle } from "@/components/mode-toggle";
import { useRouter } from "next/navigation";

interface User {
    firstName: string;
    lastName: string;
    email: string;
}

interface Restaurant {
    name: string;
}

export function Header() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const lastCountRef = useRef<number>(-1);

    const fetchUnreadCount = async () => {
        try {
            const count = await ConversationService.getUnreadCount();
            // Only show toast if:
            // 1. It's not the first load (lastCountRef.current !== -1)
            // 2. The count has increased
            if (lastCountRef.current !== -1 && count > lastCountRef.current) {
                toast.info(`You have ${count} unread conversation${count > 1 ? 's' : ''}`, {
                    description: "New message received",
                    action: {
                        label: "View",
                        onClick: () => router.push('/conversations')
                    }
                });
            }

            lastCountRef.current = count;
            setUnreadCount(count);
        } catch (error) {
            console.error("Failed to fetch unread count", error);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const storedRestaurant = localStorage.getItem("restaurant");
        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedRestaurant) setRestaurant(JSON.parse(storedRestaurant));

        // Initial fetch
        fetchUnreadCount();

        // Poll every 30s
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 px-6 backdrop-blur-md">
            {/* Search */}
            <div className="flex items-center gap-4">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search reservations..."
                        className="pl-10 bg-muted/30 border-transparent focus-visible:border-primary"
                    />
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
                {/* Restaurant name */}
                {restaurant && (
                    <span className="text-sm font-medium text-muted-foreground mr-2 hidden md:block">
                        {restaurant.name}
                    </span>
                )}

                <ModeToggle />

                {/* Notifications */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    onClick={() => router.push('/conversations')}
                >
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground shadow-sm shadow-primary/50">
                            {unreadCount}
                        </span>
                    )}
                </Button>

                {/* User avatar */}
                {user && (
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20 ring-2 ring-primary/20">
                            <span className="text-sm font-semibold text-primary-foreground">
                                {user.firstName?.[0]?.toUpperCase() || "U"}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
