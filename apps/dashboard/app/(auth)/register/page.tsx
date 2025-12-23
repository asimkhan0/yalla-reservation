"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";

const registerSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Please enter a valid email"),
    phone: z.string().min(1, "Phone number is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    restaurantName: z.string().min(1, "Restaurant name is required"),
    restaurantSlug: z
        .string()
        .min(1, "URL slug is required")
        .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
    } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    });

    // Auto-generate slug from restaurant name
    const restaurantName = watch("restaurantName");
    const handleRestaurantNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setValue("restaurantName", name);
        setValue(
            "restaurantSlug",
            name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "")
        );
    };

    async function onSubmit(values: z.infer<typeof registerSchema>) {
        setIsLoading(true);
        setError(null);
        try {
            const { data } = await api.post("/auth/register", values);

            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("refreshToken", data.refreshToken);
            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("restaurant", JSON.stringify(data.restaurant));

            router.push("/");
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || "Registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            {/* Gradient background effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-primary/10 via-transparent to-transparent" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-primary/5 via-transparent to-transparent" />
            </div>

            <Card className="w-full max-w-md relative shadow-2xl shadow-black/20">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30">
                            <span className="text-2xl font-bold text-primary-foreground">Y</span>
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
                    <CardDescription>
                        Get started with Yalla Reservation
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First name</Label>
                                <Input id="firstName" {...register("firstName")} />
                                {errors.firstName && (
                                    <p className="text-sm text-red-400">{errors.firstName.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last name</Label>
                                <Input id="lastName" {...register("lastName")} />
                                {errors.lastName && (
                                    <p className="text-sm text-red-400">{errors.lastName.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@restaurant.com"
                                {...register("email")}
                            />
                            {errors.email && (
                                <p className="text-sm text-red-400">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+1234567890"
                                {...register("phone")}
                            />
                            {errors.phone && (
                                <p className="text-sm text-red-400">{errors.phone.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                {...register("password")}
                            />
                            {errors.password && (
                                <p className="text-sm text-red-400">{errors.password.message}</p>
                            )}
                        </div>

                        <div className="border-t border-border/50 pt-4 mt-4">
                            <p className="text-sm font-medium text-muted-foreground mb-3">
                                Restaurant Details
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="restaurantName">Restaurant name</Label>
                            <Input
                                id="restaurantName"
                                placeholder="My Restaurant"
                                {...register("restaurantName")}
                                onChange={handleRestaurantNameChange}
                            />
                            {errors.restaurantName && (
                                <p className="text-sm text-red-400">{errors.restaurantName.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="restaurantSlug">URL Slug</Label>
                            <div className="flex items-center">
                                <span className="text-sm text-muted-foreground mr-1">yalla.app/</span>
                                <Input
                                    id="restaurantSlug"
                                    placeholder="my-restaurant"
                                    {...register("restaurantSlug")}
                                />
                            </div>
                            {errors.restaurantSlug && (
                                <p className="text-sm text-red-400">{errors.restaurantSlug.message}</p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Creating account..." : "Create account"}
                        </Button>
                        <p className="text-sm text-center text-muted-foreground">
                            Already have an account?{" "}
                            <Link href="/login" className="text-primary hover:underline font-medium">
                                Sign in
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
