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

// WhatsApp style date formatting
export function formatWhatsAppDate(date: Date | string | undefined | null): string {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";

    const now = new Date();
    const isToday = d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.getDate() === yesterday.getDate() &&
        d.getMonth() === yesterday.getMonth() &&
        d.getFullYear() === yesterday.getFullYear();

    if (isToday) {
        return d.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: false });
    } else if (isYesterday) {
        return "Yesterday";
    } else {
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        }); // e.g. "Dec 23, 2025" (or adjust to desired format like 23/12/2025)
        // User asked for "date could be like this as we have now" which is MMM d (implied by previous code) or similar.
        // Let's stick to consistent locale date string or custom format.
        // The previous code used `format(new Date(conv.updatedAt), 'MMM d')` in the file.
        // Let's use `d.toLocaleDateString` which is standard.
    }
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
