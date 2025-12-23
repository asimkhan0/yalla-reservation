"use client";

import { useMemo } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { cn, statusColors } from "@/lib/utils";

interface Reservation {
    _id: string;
    time: string;
    guestName: string;
    partySize: number;
    status: string;
    date: string;
}

interface CalendarViewProps {
    reservations: Reservation[];
    currentDate: Date;
    onDateSelect: (date: Date) => void;
}

// Time slots from 11:00 to 23:00
const TIME_SLOTS = Array.from({ length: 13 }, (_, i) => {
    const hour = i + 11;
    return `${hour.toString().padStart(2, "0")}:00`;
});

export function CalendarView({ reservations, currentDate, onDateSelect }: CalendarViewProps) {
    // Get the week starting from the current date's week
    const weekDays = useMemo(() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
        return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }, [currentDate]);

    // Group reservations by date and time
    const reservationMap = useMemo(() => {
        const map = new Map<string, Reservation[]>();
        reservations.forEach((res) => {
            const dateKey = new Date(res.date).toDateString();
            const timeKey = res.time.substring(0, 2) + ":00"; // Round to hour
            const key = `${dateKey}-${timeKey}`;
            if (!map.has(key)) {
                map.set(key, []);
            }
            map.get(key)!.push(res);
        });
        return map;
    }, [reservations]);

    const getReservationsForSlot = (day: Date, time: string) => {
        const key = `${day.toDateString()}-${time}`;
        return reservationMap.get(key) || [];
    };

    return (
        <div className="overflow-auto">
            <div className="min-w-[800px]">
                {/* Header row with days */}
                <div className="grid grid-cols-8 border-b border-border/50">
                    <div className="p-3 text-sm font-medium text-muted-foreground border-r border-border/50">Time</div>
                    {weekDays.map((day, i) => (
                        <div
                            key={i}
                            onClick={() => onDateSelect(day)}
                            className={cn(
                                "p-3 text-center cursor-pointer hover:bg-muted/50 transition-all duration-200",
                                isSameDay(day, currentDate) && "bg-primary/10",
                                isSameDay(day, new Date()) && "font-bold"
                            )}
                        >
                            <div className="text-xs text-muted-foreground">{format(day, "EEE")}</div>
                            <div className={cn(
                                "text-lg font-medium",
                                isSameDay(day, new Date()) && "text-primary"
                            )}>
                                {format(day, "d")}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Time slots */}
                {TIME_SLOTS.map((time) => (
                    <div key={time} className="grid grid-cols-8 border-b border-border/50 min-h-[60px]">
                        <div className="p-2 text-xs text-muted-foreground border-r border-border/50 flex items-start">
                            {time}
                        </div>
                        {weekDays.map((day, i) => {
                            const slotReservations = getReservationsForSlot(day, time);
                            return (
                                <div
                                    key={i}
                                    className={cn(
                                        "p-1 border-r border-border/50 min-h-[60px] hover:bg-muted/30 transition-colors",
                                        isSameDay(day, currentDate) && "bg-primary/5"
                                    )}
                                >
                                    {slotReservations.map((res) => (
                                        <div
                                            key={res._id}
                                            className={cn(
                                                "text-xs p-2 rounded-lg mb-1 cursor-pointer hover:opacity-90 transition-all duration-200",
                                                statusColors[res.status] || "bg-muted text-muted-foreground"
                                            )}
                                        >
                                            <div className="font-medium truncate">{res.guestName}</div>
                                            <div className="text-[10px] opacity-80">
                                                {res.time} · {res.partySize} ppl
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
