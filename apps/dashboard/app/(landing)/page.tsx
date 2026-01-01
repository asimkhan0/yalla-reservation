import { Metadata } from "next";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Pricing } from "@/components/landing/pricing";
import { CTA } from "@/components/landing/cta";

export const metadata: Metadata = {
    title: "DineLine | AI-Powered Restaurant Management",
    description: "Automate your restaurant reservations with our AI WhatsApp Agent. Stop no-shows, save time, and increase bookings.",
};

export default function LandingPage() {
    return (
        <>
            <Hero />
            <Features />
            <HowItWorks />
            <Pricing />
            <CTA />
        </>
    );
}
