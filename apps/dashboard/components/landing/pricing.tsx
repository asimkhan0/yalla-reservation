"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
    {
        name: "Starter",
        price: "$49",
        description: "Perfect for small cafes and new restaurants.",
        features: [
            "Up to 500 bookings/mo",
            "Basic WhatsApp Agent",
            "Manual Table Management",
            "Email Support",
        ],
        highlighted: false,
    },
    {
        name: "Pro",
        price: "$149",
        description: "For busy restaurants needing automation.",
        features: [
            "Unlimited bookings",
            "Advanced AI Agent (Menu + QA)",
            "Smart Table Optimization",
            "Priority WhatsApp Support",
            "Analytics Dashboard",
        ],
        highlighted: true,
    },
    {
        name: "Enterprise",
        price: "Custom",
        description: "Multiple locations and custom integrations.",
        features: [
            "All Pro features",
            "Dedicated Account Manager",
            "Custom POS Integration",
            "API Access",
            "SLA Support",
        ],
        highlighted: false,
    },
];

export function Pricing() {
    return (
        <section id="pricing" className="py-24 bg-slate-950 relative">
            <div className="container px-4 md:px-6">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl md:text-5xl font-bold text-white">
                        Simple, transparent <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                            pricing
                        </span>
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto">
                        Choose the perfect plan for your restaurant's size and needs.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className={`relative p-8 rounded-2xl border flex flex-col ${plan.highlighted
                                    ? "bg-slate-900 border-purple-500/50 shadow-2xl shadow-purple-500/10"
                                    : "bg-slate-900/50 border-white/10 hover:border-white/20"
                                }`}
                        >
                            {plan.highlighted && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                                <p className="text-slate-400 text-sm mb-6">{plan.description}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                                    {plan.price !== "Custom" && <span className="text-slate-400">/month</span>}
                                </div>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                                        <Check className="h-5 w-5 text-purple-400 shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                className={`w-full ${plan.highlighted
                                        ? "bg-white text-slate-900 hover:bg-slate-100"
                                        : "bg-white/10 text-white hover:bg-white/20"
                                    }`}
                            >
                                {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
                            </Button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
