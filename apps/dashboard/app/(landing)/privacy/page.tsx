import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy | Yalla Reservation",
    description: "Privacy Policy for Yalla Reservation services, including WhatsApp data processing.",
};

export default function PrivacyPage() {
    return (
        <div className="container py-24 max-w-4xl">
            <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
            <div className="prose prose-invert max-w-none">
                <p className="lead">Last updated: {new Date().toLocaleDateString()}</p>

                <h2>1. Introduction</h2>
                <p>
                    Yalla Reservation ("we," "our," or "us") respects your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and our AI-powered reservation management services via WhatsApp (the "Service").
                </p>

                <h2>2. Data We Collect</h2>
                <h3>2.1 Personal Information</h3>
                <p>
                    We may collect personal information that you voluntarily provide to us when you register for the Service, specifically:
                </p>
                <ul>
                    <li>Name and Contact Details (Email address, Phone number).</li>
                    <li>Business Information (Restaurant name, Address).</li>
                    <li>Reservation Data (Customer names, phone numbers, booking times).</li>
                </ul>

                <h3>2.2 WhatsApp Data</h3>
                <p>
                    By using our Service, you authorize us to process messages sent to and from your business WhatsApp account to facilitate automated reservations. This includes:
                </p>
                <ul>
                    <li>Message content (transcribed voice notes, text).</li>
                    <li>Sender's phone number and profile name.</li>
                    <li>Timestamp of interactions.</li>
                </ul>

                <h2>3. How We Use Your Information</h2>
                <p>
                    We use the information we collect to:
                </p>
                <ul>
                    <li>Provide, operate, and maintain our AI reservation agent.</li>
                    <li>Process and confirm bookings with your customers via WhatsApp.</li>
                    <li>Send you transaction-related notifications (e.g., new booking alerts).</li>
                    <li>Comply with legal obligations and prevent fraud.</li>
                </ul>

                <h2>4. Data Sharing and Disclosure</h2>
                <h3>4.1 Third-Party Service Providers</h3>
                <p>
                    We may share information with third-party vendors who perform services on our behalf, specifically:
                </p>
                <ul>
                    <li><strong>Meta Platforms, Inc. (WhatsApp):</strong> To facilitate message delivery and API integration.</li>
                    <li><strong>OpenAI:</strong> To process natural language understanding and voice transcription (solely for the purpose of booking automation).</li>
                </ul>

                <h2>5. User Consent and Opt-In</h2>
                <p>
                    <strong>For End Users (Restaurant Customers):</strong> By messaging your restaurant's WhatsApp number, customers initiate a conversation and consent to receive automated responses regarding their inquiry.
                </p>
                <p>
                    <strong>For Businesses:</strong> By connecting your WhatsApp Business account to Yalla Reservation, you explicitly consent to our processing of your business messages for the purpose of reservation management.
                </p>

                <h2>6. Data Retention</h2>
                <p>
                    We retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations.
                </p>

                <h2>7. Security of Your Information</h2>
                <p>
                    We use administrative, technical, and physical security measures to help protect your personal information. However, please be aware that no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure.
                </p>

                <h2>8. Contact Us</h2>
                <p>
                    If you have questions or comments about this Privacy Policy, please contact us at:
                    <br />
                    <strong>Email:</strong> legal@yallareservation.com [Replace with valid email]
                    <br />
                    <strong>Address:</strong> [Insert Legal Business Address]
                </p>
            </div>
        </div>
    );
}
