"use client";

import { motion } from "framer-motion";

const steps = [
    {
        number: "01",
        title: "Connect WhatsApp",
        description: "Link your business WhatsApp account in seconds. Scan the QR code and you're ready.",
    },
    {
        number: "02",
        title: "Customize Your Agent",
        description: "Set your opening hours, upload your menu, and define your table rules.",
    },
    {
        number: "03",
        title: "Auto-Pilot Mode",
        description: "Sit back as the AI handles bookings, questions, and confirmations automatically.",
    },
];

export function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl -z-10" />

            <div className="container px-4 md:px-6">
                <div className="mb-16 md:text-center max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        Setup in minutes, <br /> saves you hours
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                    {/* Connector Line (Desktop) */}
                    <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent -z-10" />

                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.2 }}
                            viewport={{ once: true }}
                            className="relative flex flex-col items-center text-center"
                        >
                            <div className="w-24 h-24 rounded-full bg-slate-900 border border-purple-500/30 flex items-center justify-center mb-6 shadow-xl z-10">
                                <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-indigo-400">
                                    {step.number}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                            <p className="text-slate-400 leading-relaxed max-w-xs">{step.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
