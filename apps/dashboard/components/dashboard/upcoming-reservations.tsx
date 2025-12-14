import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";

interface UpcomingReservationsProps {
    reservations: any[];
    loading: boolean;
}

export function UpcomingReservations({ reservations, loading }: UpcomingReservationsProps) {
    const today = formatDate(new Date());

    return (
        <Card className="col-span-1 transition-all duration-200 hover:shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Upcoming Reservations</span>
                    <span className="text-sm font-normal text-muted-foreground">
                        {today}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : reservations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No reservations scheduled for today.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {reservations.slice(0, 5).map((res) => (
                            <div
                                key={res._id}
                                className="flex items-center justify-between rounded-lg border p-3"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                        <span className="text-sm font-medium text-primary">
                                            {res.time}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-medium">{res.guestName}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {res.partySize} guests
                                        </p>
                                    </div>
                                </div>
                                <span
                                    className={cn(
                                        "rounded-full px-2 py-1 text-xs font-medium",
                                        res.status === "CONFIRMED"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-amber-100 text-amber-800"
                                    )}
                                >
                                    {res.status}
                                </span>
                            </div>
                        ))}
                        {reservations.length > 5 && (
                            <div className="pt-2 text-center">
                                <Link href="/reservations" className="text-sm text-primary hover:underline">
                                    View all {reservations.length} reservations
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
