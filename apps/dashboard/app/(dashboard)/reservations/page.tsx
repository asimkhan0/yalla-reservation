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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn, statusColors } from "@/lib/utils";
import { CreateReservationDialog } from "@/components/reservations/create-reservation-dialog";
import { CalendarView } from "@/components/reservations/calendar-view";
import api from "@/lib/api";

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

            const { data } = await api.get(`/reservations${queryParams}`);
            setReservations(data.reservations || []);

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
                    <p className="text-muted-foreground mt-1">Manage your bookings and floor plan</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setView("calendar")}
                        className={cn(
                            "transition-all duration-200",
                            view === "calendar" && "bg-primary/10 border-primary/30 text-primary"
                        )}
                    >
                        Calendar
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setView("list")}
                        className={cn(
                            "transition-all duration-200",
                            view === "list" && "bg-primary/10 border-primary/30 text-primary"
                        )}
                    >
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
                            <div className="flex items-center gap-2 min-w-[180px] justify-center font-medium">
                                <CalendarIcon className="h-4 w-4 text-primary" />
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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Guest</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Table</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                                Loading...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : reservations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No reservations for this date. Click "New Reservation" to add one.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    reservations.map((res) => (
                                        <TableRow key={res._id}>
                                            <TableCell className="font-medium">{res.time}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">{res.guestName}</div>
                                                <div className="text-xs text-muted-foreground">{res.guestPhone}</div>
                                            </TableCell>
                                            <TableCell>{res.partySize} ppl</TableCell>
                                            <TableCell>{res.table?.name || "-"}</TableCell>
                                            <TableCell>
                                                <span className={cn("px-2.5 py-1 rounded-md text-xs font-medium", statusColors[res.status])}>
                                                    {res.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
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
