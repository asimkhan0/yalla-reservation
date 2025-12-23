import Link from "next/link";
import { CalendarDays, Users, MessageSquare, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function QuickActions() {
    return (
        <Card className="col-span-1 hover:shadow-xl hover:shadow-primary/5">
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-3">
                    <Link href="/reservations">
                        <Button variant="outline" className="w-full h-24 flex flex-col gap-2 border-border/50 hover:bg-primary/10 hover:border-primary/30 hover:text-foreground transition-all duration-200">
                            <div className="rounded-lg bg-primary/10 p-2">
                                <CalendarDays className="h-5 w-5 text-primary" />
                            </div>
                            <span className="font-medium text-sm">New Reservation</span>
                        </Button>
                    </Link>

                    <Link href="/reservations">
                        <Button variant="outline" className="w-full h-24 flex flex-col gap-2 border-border/50 hover:bg-primary/10 hover:border-primary/30 hover:text-foreground transition-all duration-200">
                            <div className="rounded-lg bg-primary/10 p-2">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            <span className="font-medium text-sm">Add Walk-in</span>
                        </Button>
                    </Link>

                    <Link href="/conversations">
                        <Button variant="outline" className="w-full h-24 flex flex-col gap-2 border-border/50 hover:bg-primary/10 hover:border-primary/30 hover:text-foreground transition-all duration-200">
                            <div className="rounded-lg bg-primary/10 p-2">
                                <MessageSquare className="h-5 w-5 text-primary" />
                            </div>
                            <span className="font-medium text-sm">View Messages</span>
                        </Button>
                    </Link>

                    <Link href="/settings">
                        <Button variant="outline" className="w-full h-24 flex flex-col gap-2 border-border/50 hover:bg-primary/10 hover:border-primary/30 hover:text-foreground transition-all duration-200">
                            <div className="rounded-lg bg-primary/10 p-2">
                                <Clock className="h-5 w-5 text-primary" />
                            </div>
                            <span className="font-medium text-sm">Settings / Hours</span>
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
