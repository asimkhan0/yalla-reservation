"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { toast } from "sonner"; // If you have a toast library installed, or just use alert for now

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    whatsappNumber: z.string().optional(),
    address: z.string().optional(),
    website: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            whatsappNumber: "",
            address: "",
            website: "",
        },
    });

    useEffect(() => {
        const fetchRestaurant = async () => {
            try {
                const token = localStorage.getItem("accessToken");
                const res = await fetch("http://localhost:3001/api/restaurants/me", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) throw new Error("Failed to fetch restaurant");

                const data = await res.json();
                form.reset({
                    name: data.name,
                    whatsappNumber: data.whatsappNumber || "",
                    address: data.address || "",
                    website: data.website || "",
                });
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRestaurant();
    }, [form]);

    const onSubmit = async (values: FormValues) => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch("http://localhost:3001/api/restaurants/me", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(values),
            });

            if (!res.ok) throw new Error("Failed to update settings");

            alert("Settings saved successfully"); // Simple feedback
        } catch (error) {
            console.error(error);
            alert("Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your restaurant settings and integration preferences.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Restaurant Details</CardTitle>
                    <CardDescription>
                        Update your restaurant profile and contact information.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Restaurant Name</Label>
                            <Input id="name" {...form.register("name")} />
                            {form.formState.errors.name && (
                                <p className="text-sm text-red-500">
                                    {form.formState.errors.name.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="whatsappNumber">
                                WhatsApp Number (Twilio)
                            </Label>
                            <Input
                                id="whatsappNumber"
                                {...form.register("whatsappNumber")}
                                placeholder="whatsapp:+1234567890"
                            />
                            <p className="text-xs text-muted-foreground">
                                Format: whatsapp:+[country code][number]
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <Input id="website" {...form.register("website")} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" {...form.register("address")} />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
