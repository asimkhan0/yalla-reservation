"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
}

export function Logo({ className }: LogoProps) {
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className={cn("w-[200px] h-[100px]", className)} />;
    }

    const isDark = resolvedTheme === "dark";

    if (isDark) {
        return (
            <svg
                width="400"
                height="200"
                viewBox="0 0 400 200"
                xmlns="http://www.w3.org/2000/svg"
                className={cn("h-auto w-full", className)}
            >
                <defs>
                    <linearGradient id="dineGradDark" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#818CF8" />
                        <stop offset="80%" stop-color="#818CF8" />
                        <stop offset="100%" stop-color="#C084FC" />
                    </linearGradient>
                    <filter id="aiGlowDark" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
                <path
                    d="M40,100 C60,100 70,60 90,60 C110,60 120,140 140,140 C160,140 170,100 190,100 L220,100 C220,50 340,50 340,100 L350,100 L350,110 L210,110 L210,100"
                    stroke="url(#dineGradDark)"
                    stroke-width="8"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
                <circle cx="280" cy="55" r="6" fill="#C084FC" />
                <circle cx="40" cy="100" r="4" fill="#C084FC" filter="url(#aiGlowDark)">
                    <animate attributeName="r" values="3;7;3" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" />
                </circle>
                <text
                    x="50"
                    y="170"
                    font-family="Arial, sans-serif"
                    font-weight="900"
                    font-size="32"
                    fill="#F8F9FA"
                    letter-spacing="20"
                >
                    DINE<tspan fill="#C084FC">LINE</tspan>
                </text>
            </svg>
        );
    }

    return (
        <svg
            width="400"
            height="200"
            viewBox="0 0 400 200"
            xmlns="http://www.w3.org/2000/svg"
            className={cn("h-auto w-full", className)}
        >
            <defs>
                <linearGradient id="dineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#4F46E5" />
                    <stop offset="80%" stop-color="#4F46E5" />
                    <stop offset="100%" stop-color="#9333EA" />
                </linearGradient>
                <filter id="aiGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>
            <path
                d="M40,100 C60,100 70,60 90,60 C110,60 120,140 140,140 C160,140 170,100 190,100 L220,100 C220,50 340,50 340,100 L350,100 L350,110 L210,110 L210,100"
                stroke="url(#dineGrad)"
                stroke-width="8"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <circle cx="280" cy="55" r="6" fill="#9333EA" />
            <circle cx="40" cy="100" r="4" fill="#9333EA" filter="url(#aiGlow)">
                <animate attributeName="r" values="3;6;3" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite" />
            </circle>
            <text
                x="50"
                y="170"
                font-family="Arial, sans-serif"
                font-weight="900"
                font-size="32"
                fill="#0F172A"
                letter-spacing="20"
            >
                DINE<tspan fill="#9333EA">LINE</tspan>
            </text>
        </svg>
    );
}
