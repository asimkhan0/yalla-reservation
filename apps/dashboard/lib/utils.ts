import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// API base URL
export const API_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : "http://localhost:3001/api";

// Format date for display
export function formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export const statusColors: Record<string, string> = {
    pending: "status-pending",
    confirmed: "status-confirmed",
    seated: "status-seated",
    completed: "status-completed",
    cancelled: "status-cancelled",
    "no-show": "status-no-show",
    waitlisted: "status-waitlisted",
    // Uppercase fallbacks
    PENDING: "status-pending",
    CONFIRMED: "status-confirmed",
    SEATED: "status-seated",
    COMPLETED: "status-completed",
    CANCELLED: "status-cancelled",
    "NO-SHOW": "status-no-show",
    NO_SHOW: "status-no-show",
    WAITLISTED: "status-waitlisted",
};
