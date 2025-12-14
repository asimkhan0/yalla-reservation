"use client";

import { useEffect, useState, useCallback } from "react";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Search,
    Filter,
    MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn, statusColors, API_URL } from "@/lib/utils";
import { CreateReservationDialog } from "@/components/reservations/create-reservation-dialog";
import { CalendarView } from "@/components/reservations/calendar-view";

interface Reservation {
    _id: string;
    time: string;
    guestName: string;
    guestPhone: string;
    partySize: number;
    status: string;
    table?: { name: string };
    date: string;
}

export default function ReservationsPage() {
    const [view, setView] = useState<"list" | "calendar">("list");
    const [date, setDate] = useState<Date>(new Date());
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchReservations = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) return;

            let queryParams = "";
            if (view === "list") {
                const dateStr = date.toISOString().split("T")[0];
                queryParams = `?date=${dateStr}`;
            } else {
                // For calendar view, fetch the whole week
                const start = startOfWeek(date, { weekStartsOn: 1 });
                const end = endOfWeek(date, { weekStartsOn: 1 });
                const startStr = start.toISOString().split("T")[0];
                const endStr = end.toISOString().split("T")[0];
                queryParams = `?startDate=${startStr}&endDate=${endStr}`;
            }

            const response = await fetch(`${API_URL}/api/reservations${queryParams}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setReservations(data.reservations || []);
            }
        } catch (error) {
            console.error("Failed to fetch reservations:", error);
        } finally {
            setIsLoading(false);
        }
    }, [date, view]);

    useEffect(() => {
        fetchReservations();
    }, [fetchReservations]);

    const handlePrevious = () => {
        setDate(d => {
            if (view === "list") {
                const newDate = new Date(d);
                newDate.setDate(newDate.getDate() - 1);
                return newDate;
            } else {
                return addDays(d, -7);
            }
        });
    };

    const handleNext = () => {
        setDate(d => {
            if (view === "list") {
                const newDate = new Date(d);
                newDate.setDate(newDate.getDate() + 1);
                return newDate;
            } else {
                return addDays(d, 7);
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reservations</h1>
                    <p className="text-muted-foreground">Manage your bookings and floor plan</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setView("calendar")} className={cn(view === "calendar" && "bg-muted")}>
                        Calendar
                    </Button>
                    <Button variant="outline" onClick={() => setView("list")} className={cn(view === "list" && "bg-muted")}>
                        List
                    </Button>
                    <CreateReservationDialog onSuccess={fetchReservations} />
                </div>
            </div>

            {/* Filters & Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="flex items-center gap-2 flex-1">
                            <div className="relative flex-1 md:max-w-xs">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search by name, phone..." className="pl-9" />
                            </div>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={handlePrevious}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-2 min-w-[150px] justify-center font-medium">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                {view === "list"
                                    ? format(date, "EEE, MMM d, yyyy")
                                    : `Week of ${format(startOfWeek(date, { weekStartsOn: 1 }), "MMM d")}`
                                }
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleNext}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Content */}
            <Card>
                <CardContent className="p-0">
                    {view === "list" ? (
                        <div className="relative w-full overflow-auto">
                            {/* List View Table */}
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50">
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Time</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Guest</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Size</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Table</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-muted-foreground">Loading...</td>
                                        </tr>
                                    ) : reservations.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                                No reservations for this date. Click "New Reservation" to add one.
                                            </td>
                                        </tr>
                                    ) : (
                                        reservations.map((res) => (
                                            <tr key={res._id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-4 align-middle font-medium">{res.time}</td>
                                                <td className="p-4 align-middle">
                                                    <div className="font-medium">{res.guestName}</div>
                                                    <div className="text-xs text-muted-foreground">{res.guestPhone}</div>
                                                </td>
                                                <td className="p-4 align-middle">{res.partySize} ppl</td>
                                                <td className="p-4 align-middle">{res.table?.name || "-"}</td>
                                                <td className="p-4 align-middle">
                                                    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", statusColors[res.status])}>
                                                        {res.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 align-middle text-right">
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <CalendarView
                            reservations={reservations}
                            currentDate={date}
                            onDateSelect={(d) => {
                                setDate(d);
                                setView("list");
                            }}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
