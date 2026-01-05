import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export function LandingNavbar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/50 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/50">
            <div className="container flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center gap-3">
                    <Logo className="h-18 w-auto" />
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
