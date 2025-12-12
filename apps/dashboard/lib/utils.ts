import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// API base URL
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Format date for display
export function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
    });
}

// Format time for display
export function formatTime(time: string): string {
    const [hours = "0", minutes = "00"] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

// Status colors mapping
export const statusColors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    CONFIRMED: "bg-green-100 text-green-800",
    REMINDED: "bg-blue-100 text-blue-800",
    SEATED: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-red-100 text-red-800",
    NO_SHOW: "bg-purple-100 text-purple-800",
    WAITLISTED: "bg-cyan-100 text-cyan-800",
};
