"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Trash2, Plus, Clock, MapPin, Phone, Mail, MessageCircle, Briefcase, FileText, BadgeInfo, Image as ImageIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
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
import api from "@/lib/api";
import { WhatsAppIntegrationCard } from '@/components/settings/WhatsAppIntegrationCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useRestaurantStore } from "@/stores/use-restaurant-store";

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
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get("tab") || "general";
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [formInitialized, setFormInitialized] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Use Zustand store for restaurant data (cached)
    const { restaurant, isLoading, fetchRestaurant, updateRestaurant } = useRestaurantStore();

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

    // Fetch restaurant data if not already cached
    useEffect(() => {
        if (!restaurant) {
            fetchRestaurant();
        }
    }, [restaurant, fetchRestaurant]);

    // Initialize form when restaurant data is available
    useEffect(() => {
        if (restaurant && !formInitialized) {
            form.reset({
                name: restaurant.name,
                description: restaurant.description || "",
                whatsappNumber: restaurant.whatsappNumber || "",
                address: restaurant.address || "",
                phone: restaurant.phone || "",
                email: restaurant.email || "",
                website: restaurant.website || "",
                logo: restaurant.logo || "",
                aiPrompt: restaurant.aiPrompt || "",
                additionalContext: restaurant.additionalContext || "",
                location: {
                    address: restaurant.location?.address || restaurant.address || "",
                    googleMapsUrl: restaurant.location?.googleMapsUrl || "",
                },
                operatingHours: restaurant.operatingHours || form.getValues().operatingHours,
                services: restaurant.services || [],
            });
            setFormInitialized(true);
        }
    }, [restaurant, form, formInitialized]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const { data } = await api.post("/upload", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            form.setValue('logo', data.url, { shouldDirty: true });
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload image");
        } finally {
            setIsUploading(false);
        }
    };

    const onSubmit = async (values: FormValues) => {
        setIsSaving(true);
        try {
            if (values.location?.address) {
                values.address = values.location.address;
            }

            await api.patch("/restaurants/me", values);

            toast.success("Settings saved successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    const handleTabChange = (value: string) => {
        const url = new URL(window.location.href);
        url.searchParams.set("tab", value);
        router.push(url.pathname + url.search);
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

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 -mx-6 px-6 border-b mb-6">
                    <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b rounded-none space-x-6">
                        <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2">General</TabsTrigger>
                        <TabsTrigger value="contact" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2">Contact & Location</TabsTrigger>
                        <TabsTrigger value="hours" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2">Operating Hours</TabsTrigger>
                        <TabsTrigger value="integrations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2">WhatsApp Integration</TabsTrigger>
                        <TabsTrigger value="ai" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2">AI Assistant</TabsTrigger>
                    </TabsList>
                </div>

                <div className="grid gap-6">
                    <TabsContent value="general" className="space-y-6 mt-0">
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
                    </TabsContent>

                    <TabsContent value="contact" className="space-y-6 mt-0">
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
                    </TabsContent>

                    <TabsContent value="integrations" className="space-y-6 mt-0">
                        {/* WhatsApp Integration */}
                        {restaurant?._id && (
                            <WhatsAppIntegrationCard
                                restaurantId={restaurant._id}
                                initialConfig={restaurant.whatsappConfig as any}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="hours" className="space-y-6 mt-0">
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
                    </TabsContent>

                    <TabsContent value="ai" className="space-y-6 mt-0">
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
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
