import Link from "next/link";
import { CalendarDays, Users, MessageSquare, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function QuickActions() {
    return (
        <Card className="col-span-1 transition-all duration-200 hover:shadow-lg">
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-3">
                    <Link href="/reservations">
                        <Button variant="outline" className="w-full h-24 flex flex-col gap-2 hover:bg-muted hover:text-foreground">
                            <CalendarDays className="h-6 w-6 text-primary" />
                            <span className="font-medium">New Reservation</span>
                        </Button>
                    </Link>

                    <Link href="/reservations">
                        <Button variant="outline" className="w-full h-24 flex flex-col gap-2 hover:bg-muted hover:text-foreground">
                            <Users className="h-6 w-6 text-primary" />
                            <span className="font-medium">Add Walk-in</span>
                        </Button>
                    </Link>

                    <Link href="/conversations">
                        <Button variant="outline" className="w-full h-24 flex flex-col gap-2 hover:bg-muted hover:text-foreground">
                            <MessageSquare className="h-6 w-6 text-primary" />
                            <span className="font-medium">View Messages</span>
                        </Button>
                    </Link>

                    <Link href="/settings">
                        <Button variant="outline" className="w-full h-24 flex flex-col gap-2 hover:bg-muted hover:text-foreground">
                            <Clock className="h-6 w-6 text-primary" />
                            <span className="font-medium">Settings / Hours</span>
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
