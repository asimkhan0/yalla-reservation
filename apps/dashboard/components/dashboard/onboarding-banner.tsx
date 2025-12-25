"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useRestaurantStore } from "@/stores/use-restaurant-store";
import { Button } from "@/components/ui/button";

export function OnboardingBanner() {
    const { restaurant, fetchRestaurant, isLoading } = useRestaurantStore();

    useEffect(() => {
        if (!restaurant) {
            fetchRestaurant();
        }
    }, [restaurant, fetchRestaurant]);

    // Don't show if loading, not loaded yet, or strictly valid
    if (isLoading || !restaurant) return null;

    // Check if WhatsApp is configured
    const isWhatsAppConfigured = restaurant.whatsappConfig?.enabled;
    const isWhatsAppNumberSet = !!restaurant.whatsappNumber;

    if (isWhatsAppConfigured && isWhatsAppNumberSet) return null;

    return (
        <div className="bg-amber-500/10 border-b border-amber-500/20 py-3 px-4">
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-amber-500">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <p className="text-sm font-medium">
                        Your WhatsApp integration is not fully configured. The AI bot will not work until you complete the setup.
                    </p>
                </div>
                <Button asChild size="sm" variant="outline" className="border-amber-500/30 hover:bg-amber-500/10 text-amber-500 hover:text-amber-400">
                    <Link href="/settings?tab=integrations">
                        Complete Setup <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </div>
    );
}
