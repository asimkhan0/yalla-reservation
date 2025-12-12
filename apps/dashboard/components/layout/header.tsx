"use client";

import { useEffect, useState } from "react";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface User {
    firstName: string;
    lastName: string;
    email: string;
}

interface Restaurant {
    name: string;
}

export function Header() {
    const [user, setUser] = useState<User | null>(null);
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const storedRestaurant = localStorage.getItem("restaurant");
        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedRestaurant) setRestaurant(JSON.parse(storedRestaurant));
    }, []);

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-6">
            {/* Search */}
            <div className="flex items-center gap-4">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search reservations..."
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
                {/* Restaurant name */}
                {restaurant && (
                    <span className="text-sm font-medium text-muted-foreground">
                        {restaurant.name}
                    </span>
                )}

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
                        3
                    </span>
                </Button>

                {/* User avatar */}
                {user && (
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                                {user.firstName}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
