"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CTA() {
    return (
        <section className="py-24 relative overflow-hidden">
            {/* Background gradients */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-full blur-3xl -z-10" />

            <div className="container px-4 md:px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                    className="bg-slate-900/50 border border-white/10 rounded-3xl p-12 md:p-20 text-center backdrop-blur-sm"
                >
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        Ready to transform your <br /> restaurant?
                    </h2>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
                        Join 500+ restaurants using Yalla Reservation to save time and increase bookings.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/register">
                            <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg bg-white text-slate-950 hover:bg-slate-100">
                                Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
