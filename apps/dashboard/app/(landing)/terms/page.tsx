import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms and Conditions | DineLine",
    description: "Terms and Conditions for DineLine services.",
};

export default function TermsPage() {
    return (
        <div className="container py-24 max-w-4xl">
            <h1 className="text-4xl font-bold text-white mb-8">Terms and Conditions</h1>
            <div className="prose prose-invert max-w-none">
                <p className="lead">Last updated: {new Date().toLocaleDateString()}</p>

                <h2>1. Agreement to Terms</h2>
                <p>
                    These Terms and Conditions constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and DineLine ("we," "us," or "our"), concerning your access to and use of the DineLine website and WhatsApp AI Agent services (the "Service").
                </p>

                <h2>2. Description of Service</h2>
                <p>
                    DineLine provides an automated reservation management tool that integrates with the WhatsApp Business API. The Service utilizes AI to respond to customer inquiries and manage bookings on your behalf.
                </p>

                <h2>3. Acceptable Use Policy</h2>
                <p>
                    You agree not to use the Service to:
                </p>
                <ul>
                    <li>Send unsolicited mass messages or "spam" in violation of WhatsApp's policies.</li>
                    <li>Transmit content that is illegal, harmful, threatening, abusive, or defamatory.</li>
                    <li>Impersonate any person or entity or falsely state your affiliation with a person or entity.</li>
                    <li>Violate any applicable laws or regulations.</li>
                </ul>
                <p>
                    You acknowledge that we strictly adhere to <strong>Meta's Commerce and Business Policies</strong>. Any violation of these policies may result in immediate termination of your account.
                </p>

                <h2>4. WhatsApp Business API Compliance</h2>
                <p>
                    You are responsible for maintaining your own WhatsApp Business account in good standing. DineLine is not responsible for any bans or blocks imposed by WhatsApp due to your violation of their policies (e.g., low quality rating, spam reports).
                </p>

                <h2>5. Account & Subscription</h2>
                <p>
                    You agree to provide accurate, current, and complete information during the registration process. You are responsible for safeguarding your password and for all activities that occur under your account.
                </p>

                <h2>6. Limitation of Liability</h2>
                <p>
                    In no event will we be liable to you or any third party for any direct, indirect, consequential, exemplary, incidental, special, or punitive damages arising from your use of the service.
                </p>

                <h2>7. Modifications to Terms</h2>
                <p>
                    We may reserve the right to change, modify, or remove the contents of the Service at any time or for any reason at our sole discretion without notice.
                </p>

                {/* <h2>8. Contact Information</h2>
                <p>
                    Questions about the Terms of Service should be sent to us at:
                    <br />
                    <strong>Email:</strong> legal@getdineline.com [Replace with valid email]
                </p> */}
            </div>
        </div>
    );
}
