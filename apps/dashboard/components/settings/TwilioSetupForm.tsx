'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Copy, Loader2, CheckCircle2, Send } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface TwilioConfig {
    accountSid?: string;
    authToken?: string;
    phoneNumber?: string;
    enabled?: boolean;
}

interface TwilioSetupFormProps {
    restaurantId: string;
    config?: TwilioConfig;
    webhookUrl: string;
    onSave: (config: TwilioConfig) => Promise<void>;
    onTest: (testPhone: string) => Promise<void>;
}

export function TwilioSetupForm({
    restaurantId,
    config,
    webhookUrl,
    onSave,
    onTest
}: TwilioSetupFormProps) {
    const [accountSid, setAccountSid] = useState(config?.accountSid || '');
    const [authToken, setAuthToken] = useState(config?.authToken || '');
    const [phoneNumber, setPhoneNumber] = useState(config?.phoneNumber || '');
    const [testPhone, setTestPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    const isConnected = config?.enabled && config?.accountSid;

    const handleSave = async () => {
        if (!accountSid || !authToken || !phoneNumber) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsLoading(true);
        try {
            await onSave({
                accountSid,
                authToken,
                phoneNumber,
                enabled: true
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleTest = async () => {
        if (!testPhone) {
            toast.error('Please enter a test phone number');
            return;
        }

        setIsTesting(true);
        try {
            await onTest(testPhone);
        } finally {
            setIsTesting(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.info('Copied to clipboard');
    };

    return (
        <div className="space-y-6">
            {/* Description */}
            <div className="space-y-2">
                <h3 className="text-lg font-semibold">Twilio WhatsApp</h3>
                <p className="text-sm text-muted-foreground">
                    Connect using Twilio's WhatsApp Business API. Easiest setup with managed compliance and reliable message delivery.
                </p>
            </div>

            {/* Connection Status */}
            {isConnected && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">Twilio Connected</p>
                        <p className="text-xs text-green-600 dark:text-green-400">Phone: {config?.phoneNumber}</p>
                    </div>
                    <Badge variant="success" className="font-normal">
                        Active
                    </Badge>
                </div>
            )}

            {/* Credential Fields */}
            <div className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="accountSid">Account SID *</Label>
                    <Input
                        id="accountSid"
                        value={accountSid}
                        onChange={e => setAccountSid(e.target.value)}
                        placeholder="AC..."
                    />
                    <p className="text-xs text-muted-foreground">
                        Find this in your Twilio Console Dashboard
                    </p>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="authToken">Auth Token *</Label>
                    <Input
                        id="authToken"
                        type="password"
                        value={authToken}
                        onChange={e => setAuthToken(e.target.value)}
                        placeholder="••••••••"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="twilioPhone">WhatsApp Phone Number *</Label>
                    <Input
                        id="twilioPhone"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        placeholder="+1234567890"
                    />
                    <p className="text-xs text-muted-foreground">
                        Include country code. Must match your Twilio WhatsApp sender.
                    </p>
                </div>
            </div>

            {/* Webhook Configuration */}
            <div className="rounded-xl bg-muted/50 border border-border/50 p-4 space-y-3">
                <div className="text-sm font-medium">Webhook Configuration</div>
                <p className="text-sm text-muted-foreground">
                    Paste this URL into the "A message comes in" section of your Twilio Phone Number settings.
                </p>
                <div className="flex items-center gap-2">
                    <Input readOnly value={webhookUrl} className="font-mono text-xs" />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(webhookUrl)}>
                        <span className="sr-only">Copy</span>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between pt-4 border-t">
                <div className="flex gap-2">
                    <Input
                        placeholder="Test Phone (+1...)"
                        value={testPhone}
                        onChange={e => setTestPhone(e.target.value)}
                        className="w-[180px]"
                    />
                    <Button
                        variant="secondary"
                        onClick={handleTest}
                        disabled={isTesting || !testPhone || !isConnected}
                    >
                        {isTesting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="mr-2 h-4 w-4" />
                        )}
                        Test
                    </Button>
                </div>
                <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isConnected ? 'Update Configuration' : 'Save & Connect'}
                </Button>
            </div>
        </div>
    );
}
