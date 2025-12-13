"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Trash2, Plus, Clock, MapPin, Phone, Mail, MessageCircle, Briefcase, FileText, BadgeInfo, Image as ImageIcon } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

// Schema matching the API
const operatingHoursSchema = z.object({
    open: z.string().optional(),
    close: z.string().optional(),
    closed: z.boolean().optional(),
}).optional();

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    whatsappNumber: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    website: z.string().optional(),
    logo: z.string().optional(),
    aiPrompt: z.string().optional(),
    additionalContext: z.string().optional(),
    location: z.object({
        address: z.string().optional(),
        googleMapsUrl: z.string().optional(),
    }).optional(),
    operatingHours: z.object({
        monday: operatingHoursSchema,
        tuesday: operatingHoursSchema,
        wednesday: operatingHoursSchema,
        thursday: operatingHoursSchema,
        friday: operatingHoursSchema,
        saturday: operatingHoursSchema,
        sunday: operatingHoursSchema,
    }).optional(),
    services: z.array(z.object({
        name: z.string().min(1, "Service name required"),
        description: z.string().optional(),
        duration: z.array(z.number()),
        price: z.number().optional()
    })).optional()
});

type FormValues = z.infer<typeof formSchema>;

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            services: [],
            operatingHours: {
                monday: { open: "09:00", close: "22:00" },
                tuesday: { open: "09:00", close: "22:00" },
                wednesday: { open: "09:00", close: "22:00" },
                thursday: { open: "09:00", close: "22:00" },
                friday: { open: "14:00", close: "23:00" },
                saturday: { open: "10:00", close: "23:00" },
                sunday: { open: "10:00", close: "23:00" },
            }
        },
    });

    const { fields: serviceFields, append: appendService, remove: removeService } = useFieldArray({
        control: form.control,
        name: "services",
    });

    useEffect(() => {
        const fetchRestaurant = async () => {
            try {
                const token = localStorage.getItem("accessToken");
                if (!token) return;

                const res = await fetch("http://localhost:3001/api/restaurants/me", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) throw new Error("Failed to fetch restaurant");

                const data = await res.json();

                form.reset({
                    name: data.name,
                    description: data.description || "",
                    whatsappNumber: data.whatsappNumber || "",
                    address: data.address || "",
                    phone: data.phone || "", // Added phone to reset
                    email: data.email || "",
                    website: data.website || "",
                    logo: data.logo || "",
                    aiPrompt: data.aiPrompt || "",
                    additionalContext: data.additionalContext || "",
                    location: {
                        address: data.location?.address || data.address || "",
                        googleMapsUrl: data.location?.googleMapsUrl || "",
                    },
                    operatingHours: data.operatingHours || form.getValues().operatingHours,
                    services: data.services || [],
                });
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRestaurant();
    }, [form]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch("http://localhost:3001/api/upload", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");

            const data = await res.json();
            // Assuming the backend returns { url: string }
            form.setValue('logo', data.url, { shouldDirty: true });
        } catch (error) {
            console.error(error);
            alert("Failed to upload image");
        } finally {
            setIsUploading(false);
        }
    };

    const onSubmit = async (values: FormValues) => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem("accessToken");
            if (values.location?.address) {
                values.address = values.location.address;
            }

            const res = await fetch("http://localhost:3001/api/restaurants/me", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(values),
            });

            if (!res.ok) throw new Error("Failed to update settings");

            alert("Settings saved successfully");
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
        <div className="space-y-6">
            {/* Header matching Reservations Page */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground">Manage your restaurant profile and preferences</p>
                </div>
                <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid gap-6">
                {/* Team Logo & Name Section */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Team Logo</CardTitle>
                            <CardDescription>Update your team's logo to make it easier to identify</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div
                                    className="relative flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center rounded-full border border-dashed hover:bg-muted/50 transition-colors overflow-hidden group"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {isUploading ? (
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    ) : form.watch('logo') ? (
                                        <>
                                            <img
                                                src={form.watch('logo') || ''}
                                                alt="Logo"
                                                className="h-full w-full object-cover"
                                                onError={(e) => {
                                                    // Fallback if image fails to load (e.g. relative path on different host)
                                                    // Try prepending API URL if it looks like a relative path
                                                    const target = e.target as HTMLImageElement;
                                                    if (target.src.includes('localhost:3000/uploads')) {
                                                        target.src = target.src.replace('3000', '3001');
                                                    }
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Upload className="h-6 w-6 text-white" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                            <ImageIcon className="h-8 w-8" />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium leading-none">Profile Picture</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Click the image to upload. JPG, PNG or GIF up to 5MB.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Business Details</CardTitle>
                            <CardDescription>Update your public business information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Business Name *</Label>
                                <div className="flex items-center gap-2">
                                    <Input id="name" {...form.register("name")} placeholder="Padel Club" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    {...form.register("description")}
                                    placeholder="Premium padel courts..."
                                    className="min-h-[80px]"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Contact & Location */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                            <CardDescription>How customers can reach you</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Phone Number *</Label>
                                <Input {...form.register("phone")} placeholder="+966 55 555 5555" />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input {...form.register("email")} placeholder="info@example.com" />
                            </div>
                            <div className="space-y-2">
                                <Label>WhatsApp</Label>
                                <Input {...form.register("whatsappNumber")} placeholder="whatsapp:+966555..." />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Location</CardTitle>
                            <CardDescription>Your physical location</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Address *</Label>
                                <Input {...form.register("location.address")} placeholder="Full address" />
                            </div>
                            <div className="space-y-2">
                                <Label>Google Maps URL</Label>
                                <Input {...form.register("location.googleMapsUrl")} placeholder="https://maps.google.com/..." />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Operating Hours & Services */}
                <Card>
                    <CardHeader>
                        <CardTitle>Operating Hours</CardTitle>
                        <CardDescription>Default opening hours</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {DAYS.map((day) => (
                            <div key={day} className="flex items-center gap-4">
                                <div className="w-24 font-medium capitalize text-sm">{day}</div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="time"
                                        className="w-32"
                                        {...form.register(`operatingHours.${day}.open`)}
                                    />
                                    <span className="text-muted-foreground text-sm">to</span>
                                    <Input
                                        type="time"
                                        className="w-32"
                                        {...form.register(`operatingHours.${day}.close`)}
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Services</CardTitle>
                                <CardDescription>Services offered to customers</CardDescription>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => appendService({ name: "", duration: [60], price: 0 })}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Service
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {serviceFields.map((field, index) => (
                            <div key={field.id} className="p-4 border rounded-lg bg-muted/10 relative">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                                    onClick={() => removeService(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>

                                <div className="grid gap-4 md:grid-cols-2 pr-8">
                                    <div className="space-y-2">
                                        <Label>Name</Label>
                                        <Input {...form.register(`services.${index}.name`)} placeholder="e.g. Court Rental" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Price</Label>
                                        <Input
                                            type="number"
                                            {...form.register(`services.${index}.price`, { valueAsNumber: true })}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Duration (min)</Label>
                                        <Input
                                            type="number"
                                            className="max-w-[200px]"
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (!isNaN(val)) form.setValue(`services.${index}.duration`, [val]);
                                            }}
                                            defaultValue={form.getValues(`services.${index}.duration`)?.[0]}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {serviceFields.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                                No services added. Add one to get started.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* AI Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5" />
                            AI Assistant
                        </CardTitle>
                        <CardDescription>Configure how your WhatsApp bot behaves</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>System Prompt (Personality)</Label>
                            <Textarea
                                {...form.register("aiPrompt")}
                                placeholder="You are a helpful assistant for..."
                                className="min-h-[100px]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Additional Context</Label>
                            <Textarea
                                {...form.register("additionalContext")}
                                placeholder="Policies, amenities, wifi password..."
                                className="min-h-[100px]"
                            />
                            <p className="text-xs text-muted-foreground">
                                This context is injected into the AI to help it answer specific questions.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
