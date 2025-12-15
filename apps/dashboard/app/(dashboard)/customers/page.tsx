"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { format } from "date-fns";
import { Search, Loader2, Star, Ban, Mail, Phone as PhoneIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface Customer {
    _id: string;
    firstName?: string;
    lastName?: string;
    phone: string;
    email?: string;
    totalVisits: number;
    noShows: number;
    vipStatus: boolean;
    lastVisit?: string;
    notes?: string;
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState("");
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchCustomers = async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get('/customers', {
                params: { search: debouncedSearch }
            });
            setCustomers(data.customers);
        } catch (error) {
            console.error("Failed to fetch customers", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, [debouncedSearch]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your customer database and view history.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Customer Directory</CardTitle>
                            <CardDescription>
                                A list of all customers who have made reservations.
                            </CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search customers..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Visits</TableHead>
                                    <TableHead className="text-right">No Shows</TableHead>
                                    <TableHead className="text-right">Last Visit</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <div className="flex justify-center items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Loading...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : customers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            No customers found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    customers.map((customer) => (
                                        <TableRow key={customer._id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarFallback className="bg-primary/10 text-primary">
                                                            {customer.firstName?.[0] || customer.phone?.[0] || "?"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">
                                                            {customer.firstName || customer.lastName
                                                                ? `${customer.firstName || ''} ${customer.lastName || ''}`
                                                                : 'Unknown Name'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <PhoneIcon className="h-3 w-3" />
                                                        {customer.phone}
                                                    </div>
                                                    {customer.email && (
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="h-3 w-3" />
                                                            {customer.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    {customer.vipStatus && (
                                                        <Badge variant="default" className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-500/20">
                                                            <Star className="h-3 w-3 mr-1 fill-yellow-600" />
                                                            VIP
                                                        </Badge>
                                                    )}
                                                    {customer.noShows > 2 && (
                                                        <Badge variant="destructive" className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20">
                                                            <Ban className="h-3 w-3 mr-1" />
                                                            Risk
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {customer.totalVisits}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                {customer.noShows}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                {customer.lastVisit ? format(new Date(customer.lastVisit), 'MMM d, yyyy') : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
