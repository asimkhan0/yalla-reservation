"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Search,
    Filter,
    Plus,
    MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, statusColors } from "@/lib/utils";

// Mock data
const MOCK_RESERVATIONS = [
    { id: 1, name: "John Smith", date: new Date(), time: "18:00", partySize: 4, status: "CONFIRMED", table: "Table 5" },
    { id: 2, name: "Sarah Johnson", date: new Date(), time: "18:30", partySize: 2, status: "PENDING", table: "-" },
    { id: 3, name: "Michael Brown", date: new Date(), time: "19:00", partySize: 6, status: "SEATED", table: "Table 8" },
    { id: 4, name: "Emily Davis", date: new Date(), time: "19:30", partySize: 3, status: "CONFIRMED", table: "Table 2" },
    { id: 5, name: "David Wilson", date: new Date(), time: "20:00", partySize: 2, status: "WAITLISTED", table: "-" },
    { id: 6, name: "Jessica Taylor", date: new Date(), time: "20:30", partySize: 5, status: "CANCELLED", table: "-" },
];

export default function ReservationsPage() {
    const [view, setView] = useState<"list" | "calendar">("list");
    const [date, setDate] = useState<Date>(new Date());

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reservations</h1>
                    <p className="text-muted-foreground">
                        Manage your bookings and floor plan
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setView("calendar")} className={cn(view === "calendar" && "bg-muted")}>
                        Calendar
                    </Button>
                    <Button variant="outline" onClick={() => setView("list")} className={cn(view === "list" && "bg-muted")}>
                        List
                    </Button>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Reservation
                    </Button>
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
                            <Button variant="ghost" size="icon" onClick={() => setDate(d => new Date(d.setDate(d.getDate() - 1)))}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-2 min-w-[150px] justify-center font-medium">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                {format(date, "EEE, MMM d, yyyy")}
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setDate(d => new Date(d.setDate(d.getDate() + 1)))}>
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
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Time</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Guest</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Size</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Table</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {MOCK_RESERVATIONS.map((res) => (
                                        <tr key={res.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <td className="p-4 align-middle font-medium">{res.time}</td>
                                            <td className="p-4 align-middle">
                                                <div className="font-medium">{res.name}</div>
                                                <div className="text-xs text-muted-foreground">+1 (555) 123-4567</div>
                                            </td>
                                            <td className="p-4 align-middle">{res.partySize} ppl</td>
                                            <td className="p-4 align-middle">{res.table}</td>
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
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">
                            Calendar view coming soon...
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
