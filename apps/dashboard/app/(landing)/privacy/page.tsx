import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy | Yalla Reservation",
    description: "Privacy Policy for Yalla Reservation services.",
};

export default function PrivacyPage() {
    return (
        <div className="container py-24 max-w-4xl">
            <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
            <div className="prose prose-invert max-w-none">
                <p className="lead">Last updated: {new Date().toLocaleDateString()}</p>

                <h2>1. Information We Collect</h2>
                <p>
                    We collect information you provide directly to us, such as when you create an account, subscribe to our newsletter, or contact us for support.
                </p>

                <h2>2. How We Use Information</h2>
                <p>
                    We use the information we collect to provide, maintain, and improve our services, to process your transactions, and to communicate with you.
                </p>

                <h2>3. Data Sharing</h2>
                <p>
                    We do not share your personal information with third parties except as described in this privacy policy or with your consent.
                </p>

                <h2>4. Data Security</h2>
                <p>
                    We implement reasonable security measures to protect your personal information from unauthorized access and disclosure.
                </p>

                <h2>5. Your Rights</h2>
                <p>
                    You have the right to access, correct, or delete your personal information. You may also object to the processing of your personal information.
                </p>

                <h2>6. Cookies</h2>
                <p>
                    We use cookies to improve your experience on our website. You can control cookies through your browser settings.
                </p>

                <h2>7. Contact Us</h2>
                <p>
                    If you have any questions about this Privacy Policy, please contact us at privacy@yallareservation.com.
                </p>
            </div>
        </div>
    );
}
