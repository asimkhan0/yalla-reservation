import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms and Conditions | Yalla Reservation",
    description: "Terms and Conditions for Yalla Reservation services.",
};

export default function TermsPage() {
    return (
        <div className="container py-24 max-w-4xl">
            <h1 className="text-4xl font-bold text-white mb-8">Terms and Conditions</h1>
            <div className="prose prose-invert max-w-none">
                <p className="lead">Last updated: {new Date().toLocaleDateString()}</p>

                <h2>1. Introduction</h2>
                <p>
                    Welcome to Yalla Reservation. By accessing our website and using our services, you agree to be bound by these Terms and Conditions.
                </p>

                <h2>2. Services</h2>
                <p>
                    Yalla Reservation provides AI-powered reservation management services for restaurants via WhatsApp integration.
                </p>

                <h2>3. User Accounts</h2>
                <p>
                    You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                </p>

                <h2>4. Acceptable Use</h2>
                <p>
                    You agree not to use our services for any unlawful purpose or to violate any laws in your jurisdiction.
                </p>

                <h2>5. Limitation of Liability</h2>
                <p>
                    Yalla Reservation shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
                </p>

                <h2>6. Changes to Terms</h2>
                <p>
                    We reserve the right to modify these terms at any time. We will notify users of any material changes.
                </p>

                <h2>7. Contact</h2>
                <p>
                    If you have any questions about these Terms, please contact us at legal@yallareservation.com.
                </p>
            </div>
        </div>
    );
}
