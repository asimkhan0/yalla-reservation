import Link from "next/link";
import { Bot, Github, Twitter, Linkedin } from "lucide-react";

export function LandingFooter() {
    return (
        <footer className="border-t border-white/10 bg-slate-950 pt-16 pb-8">
            <div className="container">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2">
                            <Bot className="h-6 w-6 text-purple-400" />
                            <span className="text-xl font-bold text-white">
                                Yalla Reservation
                            </span>
                        </Link>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            AI-powered reservation management for modern restaurants. Stop no-shows and automate your bookings.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white mb-6">Product</h3>
                        <ul className="space-y-4 text-sm text-slate-400">
                            <li><Link href="#features" className="hover:text-purple-400 transition-colors">Features</Link></li>
                            <li><Link href="#pricing" className="hover:text-purple-400 transition-colors">Pricing</Link></li>
                            <li><Link href="#integrations" className="hover:text-purple-400 transition-colors">Integrations</Link></li>
                            <li><Link href="/changelog" className="hover:text-purple-400 transition-colors">Changelog</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white mb-6">Company</h3>
                        <ul className="space-y-4 text-sm text-slate-400">
                            <li><Link href="/about" className="hover:text-purple-400 transition-colors">About</Link></li>
                            <li><Link href="/blog" className="hover:text-purple-400 transition-colors">Blog</Link></li>
                            <li><Link href="/careers" className="hover:text-purple-400 transition-colors">Careers</Link></li>
                            <li><Link href="/contact" className="hover:text-purple-400 transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white mb-6">Legal</h3>
                        <ul className="space-y-4 text-sm text-slate-400">
                            <li><Link href="/terms" className="hover:text-purple-400 transition-colors">Terms</Link></li>
                            <li><Link href="/privacy" className="hover:text-purple-400 transition-colors">Privacy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-slate-500">
                        © {new Date().getFullYear()} Yalla Reservation. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <Link href="#" className="text-slate-500 hover:text-white transition-colors">
                            <Twitter className="h-5 w-5" />
                        </Link>
                        <Link href="#" className="text-slate-500 hover:text-white transition-colors">
                            <Github className="h-5 w-5" />
                        </Link>
                        <Link href="#" className="text-slate-500 hover:text-white transition-colors">
                            <Linkedin className="h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
