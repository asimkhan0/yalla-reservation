import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";

export default function LandingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-purple-500/30">
            <LandingNavbar />
            <main>{children}</main>
            <LandingFooter />
        </div>
    );
}
