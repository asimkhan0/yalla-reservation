import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";

export function LandingNavbar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/50 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/50">
            <div className="container flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <Bot className="h-6 w-6 text-purple-400" />
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        DineLine
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
                    <Link href="#features" className="hover:text-white transition-colors">
                        Features
                    </Link>
                    <Link href="#how-it-works" className="hover:text-white transition-colors">
                        How it Works
                    </Link>
                    <Link href="#pricing" className="hover:text-white transition-colors">
                        Pricing
                    </Link>
                </nav>

                <div className="flex items-center gap-4">
                    <Link href="/login">
                        <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10">
                            Login
                        </Button>
                    </Link>
                    <Link href="/register">
                        <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white border-0">
                            Get Started
                        </Button>
                    </Link>
                </div>
            </div>
        </header>
    );
}
