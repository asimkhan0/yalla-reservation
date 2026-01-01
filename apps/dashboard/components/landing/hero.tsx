"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function Hero() {
    return (
        <section className="relative overflow-hidden pt-32 pb-20 md:pt-48 md:pb-32">
            {/* Background gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-purple-500/20 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl -z-10" />

            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center text-center space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-sm text-purple-300"
                    >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>AI-Powered Restaurant Management</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white max-w-4xl"
                    >
                        The Future of{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                            Reservations
                        </span>{" "}
                        is Here
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto"
                    >
                        Stop losing customers to missed calls. Automate your bookings with an intelligent WhatsApp agent that works 24/7.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4 w-full justify-center"
                    >
                        <Link href="/register">
                            <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-0 shadow-lg shadow-purple-500/20">
                                Start Free Trial
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="#demo">
                            <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent">
                                Watch Demo
                            </Button>
                        </Link>
                    </motion.div>

                    {/* Hero Visual/Dashboard Mockup */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="mt-16 relative w-full max-w-5xl mx-auto rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-sm shadow-2xl p-2"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-indigo-500/10 rounded-xl" />
                        <div className="relative rounded-lg overflow-hidden aspect-video bg-slate-950 border border-white/5 flex items-center justify-center">
                            <img
                                src="/dashboard-hero.png"
                                alt="DineLine Dashboard"
                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                            />
                        </div>
                    </motion.div>
                </div>
            </div >
        </section >
    );
}
