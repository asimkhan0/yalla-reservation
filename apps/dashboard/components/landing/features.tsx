"use client";

import { motion } from "framer-motion";
import { Bot, MessageSquare, BarChart3, ShieldCheck, Clock, Smartphone } from "lucide-react";

const features = [
    {
        icon: Bot,
        title: "24/7 AI Agent",
        description: "Never miss a reservation. Our AI handles inquiries and bookings instantly, day or night.",
    },
    {
        icon: Smartphone,
        title: "WhatsApp Integrated",
        description: "Meet your customers where they are. Seamless booking experience directly within WhatsApp.",
    },
    {
        icon: ShieldCheck,
        title: "No-Show Protection",
        description: "Automated confirmations and deposits (coming soon) to drastically reduce no-shows.",
    },
    {
        icon: Clock,
        title: "Real-time Availability",
        description: "Two-way sync with your table management. No double bookings, ever.",
    },
    {
        icon: MessageSquare,
        title: "Smart Responses",
        description: "Answers FAQs about menu, location, and parking automatically.",
    },
    {
        icon: BarChart3,
        title: "Deep Analytics",
        description: "Understand your peak hours and loyal customers with detailed insights.",
    },
];

export function Features() {
    return (
        <section id="features" className="py-24 bg-slate-950/50 relative">
            <div className="container px-4 md:px-6">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl md:text-5xl font-bold text-white">
                        Everything you need to run <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                            smarter
                        </span>
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto">
                        Packed with features to streamline your operations and delight your guests.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/[0.07] transition-all group"
                        >
                            <div className="h-12 w-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <feature.icon className="h-6 w-6 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                            <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
