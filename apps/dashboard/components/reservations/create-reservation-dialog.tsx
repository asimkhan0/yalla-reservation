"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import api from "@/lib/api";

const formSchema = z.object({
    date: z.string().min(1, "Date is required"),
    time: z.string().min(1, "Time is required"),
    partySize: z.coerce.number().min(1, "At least 1 guest"),
    guestName: z.string().min(1, "Name is required"),
    guestPhone: z.string().min(1, "Phone is required"),
    guestEmail: z.string().email().optional().or(z.literal("")),
    specialRequests: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
    onSuccess: () => void;
}

export function CreateReservationDialog({ onSuccess }: Props) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            date: new Date().toISOString().split("T")[0],
            time: "19:00",
            partySize: 2,
        },
    });

    const onSubmit = async (values: FormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const formattedDate = new Date(values.date);
            const [hoursStr, minutesStr] = values.time.split(":");
            formattedDate.setHours(parseInt(hoursStr || "0", 10), parseInt(minutesStr || "0", 10));

            await api.post("/reservations", {
                ...values,
                date: formattedDate.toISOString(),
                guestEmail: values.guestEmail || undefined,
            });

            reset();
            setOpen(false);
            onSuccess();
        } catch (err: any) {
            console.error("Failed to create reservation", err);
            setError(err.response?.data?.message || err.message || "Failed to create reservation");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Reservation
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>New Reservation</DialogTitle>
                    <DialogDescription>Add a new booking to the calendar.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input id="date" type="date" {...register("date")} />
                                {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="time">Time</Label>
                                <Input id="time" type="time" {...register("time")} />
                                {errors.time && <p className="text-sm text-red-500">{errors.time.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="partySize">Party Size</Label>
                            <Input id="partySize" type="number" min="1" {...register("partySize")} />
                            {errors.partySize && <p className="text-sm text-red-500">{errors.partySize.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="guestName">Guest Name</Label>
                            <Input id="guestName" placeholder="John Smith" {...register("guestName")} />
                            {errors.guestName && <p className="text-sm text-red-500">{errors.guestName.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="guestPhone">Phone</Label>
                            <Input id="guestPhone" placeholder="+1 234 567 8900" {...register("guestPhone")} />
                            {errors.guestPhone && <p className="text-sm text-red-500">{errors.guestPhone.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="guestEmail">Email (optional)</Label>
                            <Input id="guestEmail" type="email" placeholder="guest@email.com" {...register("guestEmail")} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="specialRequests">Special Requests</Label>
                            <Input id="specialRequests" placeholder="Allergies, occasion..." {...register("specialRequests")} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Creating..." : "Create Reservation"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
