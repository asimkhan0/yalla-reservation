"use client";

import { useEffect, useState } from "react";
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
                const res = await fetch("http://localhost:3001/api/restaurants/me", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) throw new Error("Failed to fetch restaurant");

                const data = await res.json();

                // Formulate default values carefully
                form.reset({
                    name: data.name,
                    description: data.description || "",
                    whatsappNumber: data.whatsappNumber || "",
                    address: data.address || "",
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

    const onSubmit = async (values: FormValues) => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem("accessToken");
            // Sync legacy address field
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-8 max-w-4xl mx-auto p-6 text-sm"> {/* text-sm base like user snippet */}

            {/* Team Logo & Name Section */}
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Team Logo</CardTitle>
                        <CardDescription>Update your team's logo to make it easier to identify</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-4">
                            <div className="relative flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-full border border-dashed border-border hover:border-primary transition-colors">
                                {form.watch('logo') ? (
                                    <img src={form.watch('logo') || ''} alt="Logo" className="h-full w-full rounded-full object-cover" />
                                ) : (
                                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex flex-col space-y-1">
                                <span className="text-sm font-medium">Logo URL</span>
                                <Input {...form.register('logo')} placeholder="https://example.com/logo.png" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Team Name</CardTitle>
                        <CardDescription>Update your team's name</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="name">Business Name *</Label>
                            <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                <Input id="name" {...form.register("name")} placeholder="Padel Club" />
                            </div>
                            {form.formState.errors.name && (
                                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-destructive/50">
                    <CardHeader>
                        <CardTitle>Danger Zone</CardTitle>
                        <CardDescription>This section contains actions that are irreversible</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="destructive" type="button" onClick={() => alert('Feature coming soon')}>Leave Team</Button>
                    </CardContent>
                </Card>
            </div>

            <Separator />

            {/* Business Information */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Business Information</h2>
                    <p className="text-muted-foreground">Configure your business details, operating hours, and services.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase className="h-5 w-5" />
                            Basic Information
                        </CardTitle>
                        <CardDescription>General information about your business</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                {...form.register("description")}
                                placeholder="Premium padel courts in the heart of Jeddah..."
                                className="min-h-[100px]"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Location */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Location
                        </CardTitle>
                        <CardDescription>Your business location and address</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Address *</Label>
                            <Input {...form.register("location.address")} placeholder="King Abdulaziz St, Jeddah, KSA" />
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Google Maps URL (Optional)
                            </Label>
                            <Input {...form.register("location.googleMapsUrl")} placeholder="https://maps.google.com/..." />
                            <p className="text-xs text-muted-foreground">Direct link to your location on Google Maps</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Phone className="h-5 w-5" />
                            Contact Information
                        </CardTitle>
                        <CardDescription>How customers can reach you</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                Phone Number *
                            </Label>
                            <Input {...form.register("phone")} placeholder="+966 55 555 5555" />
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Email (Optional)
                            </Label>
                            <Input {...form.register("email")} placeholder="info@example.com" />
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <MessageCircle className="h-4 w-4" />
                                WhatsApp
                            </Label>
                            <Input {...form.register("whatsappNumber")} placeholder="whatsapp:+1234567890" />
                        </div>
                    </CardContent>
                </Card>

                {/* Operating Hours */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Operating Hours
                        </CardTitle>
                        <CardDescription>When your business is open</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {DAYS.map((day) => (
                            <div key={day} className="flex items-center gap-4">
                                <div className="w-24 font-medium capitalize">{day}</div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="time"
                                        className="w-32"
                                        {...form.register(`operatingHours.${day}.open`)}
                                    />
                                    <span className="text-muted-foreground">to</span>
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

                {/* Services */}
                <Card>
                    <CardHeader>
                        <CardTitle>Services</CardTitle>
                        <CardDescription>What services do you offer?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {serviceFields.map((field, index) => (
                            <div key={field.id} className="space-y-4 p-4 border rounded-lg relative">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-medium">Service {index + 1}</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                                        onClick={() => removeService(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Service Name *</Label>
                                        <Input {...form.register(`services.${index}.name`)} placeholder="Court Rental" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Input {...form.register(`services.${index}.description`)} placeholder="Description..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Price (Optional)</Label>
                                        <Input
                                            type="number"
                                            {...form.register(`services.${index}.price`, { valueAsNumber: true })}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label>Available Durations (minutes) *</Label>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        {/* Simple duration management: Comma separated for MVP convenience, or fixed list */}
                                        {/* For now, let's implement a simplified single duration or assume standard 60/90. 
                                            The user snippet showed adding multiple. Mapping simplified logic: */}
                                        <Input
                                            type="number"
                                            placeholder="Duration in min"
                                            className="w-32"
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (!isNaN(val)) {
                                                    form.setValue(`services.${index}.duration`, [val]);
                                                }
                                            }}
                                            defaultValue={form.getValues(`services.${index}.duration`)?.[0]}
                                        />
                                        <span className="text-sm text-muted-foreground">minutes</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Multiple durations support coming soon.</p>
                                </div>
                            </div>
                        ))}

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full border-dashed"
                            onClick={() => appendService({ name: "", duration: [60], price: 0 })}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Service
                        </Button>
                    </CardContent>
                </Card>

                {/* AI Prompt */}
                <Card>
                    <CardHeader>
                        <CardTitle>AI Assistant Prompt</CardTitle>
                        <CardDescription>Customize how your AI assistant introduces your business</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label>Custom AI Prompt</Label>
                            <Textarea
                                {...form.register("aiPrompt")}
                                placeholder="You are a helpful assistant for Elite Padel Courts..."
                                className="min-h-[100px]"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Additional Context */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Additional Context
                        </CardTitle>
                        <CardDescription>Extra information about your business</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label>Additional Context</Label>
                            <Textarea
                                {...form.register("additionalContext")}
                                placeholder="Special features, amenities, policies..."
                                className="min-h-[120px]"
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                This information will be available to your AI assistant to provide more accurate responses.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving} className="min-w-[120px]">
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>

            </div>
        </form>
    );
}
