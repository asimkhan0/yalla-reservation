'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Loader2, CheckCircle2, Send, MessageSquare, Zap, Settings } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { MetaEmbeddedSignup } from './MetaEmbeddedSignup';

interface MetaConfig {
    phoneNumberId?: string;
    wabaId?: string;
    accessToken?: string;
    webhookVerifyToken?: string;
    businessName?: string;
    displayPhoneNumber?: string;
    enabled?: boolean;
}

interface MetaSetupFormProps {
    restaurantId: string;
    config?: MetaConfig;
    webhookUrl: string;
    onSave: (config: MetaConfig) => Promise<void>;
    onDisconnect: () => Promise<void>;
    onTest: (testPhone: string) => Promise<void>;
    onEmbeddedSignup?: (data: { code: string; wabaId: string; phoneNumberId: string }) => Promise<void>;
}

export function MetaSetupForm({
    restaurantId,
    config,
    webhookUrl,
    onSave,
    onDisconnect,
    onTest,
    onEmbeddedSignup
}: MetaSetupFormProps) {
    const [phoneNumberId, setPhoneNumberId] = useState(config?.phoneNumberId || '');
    const [wabaId, setWabaId] = useState(config?.wabaId || '');
    const [accessToken, setAccessToken] = useState(config?.accessToken || '');
    const [testPhone, setTestPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [isEmbeddedSignupLoading, setIsEmbeddedSignupLoading] = useState(false);

    const isConnected = config?.enabled && config?.phoneNumberId;
    const verifyToken = config?.webhookVerifyToken || 'Generated on save';

    const handleSave = async () => {
        if (!phoneNumberId || !wabaId || !accessToken) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsLoading(true);
        try {
            await onSave({
                phoneNumberId,
                wabaId,
                accessToken,
                enabled: true
            });
            setShowForm(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisconnect = async () => {
        setIsDisconnecting(true);
        try {
            await onDisconnect();
        } finally {
            setIsDisconnecting(false);
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

    // Connected State View
    if (isConnected && !showForm) {
        return (
            <div className="space-y-6">
                {/* Description */}
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Meta WhatsApp Business API</h3>
                    <p className="text-sm text-muted-foreground">
                        Connect using Meta's official WhatsApp Business API. This requires a verified business account and provides advanced features like message templates and business profiles.
                    </p>
                </div>

                {/* Connection Status Card */}
                <div className="rounded-xl border bg-card p-6 space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold">WhatsApp Business Connection</h4>
                                <p className="text-sm text-muted-foreground">Current WhatsApp Business API connection status</p>
                            </div>
                        </div>
                        <Badge variant="success" className="font-normal">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Connected
                        </Badge>
                    </div>

                    <div className="grid gap-3 pt-2 border-t">
                        <div className="grid grid-cols-[140px_1fr] gap-2 items-center">
                            <span className="text-sm font-medium text-muted-foreground">Business Name:</span>
                            <span className="text-sm">{config?.businessName || 'Your Business'}</span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr] gap-2 items-center">
                            <span className="text-sm font-medium text-muted-foreground">Phone Number:</span>
                            <span className="text-sm font-mono">{config?.displayPhoneNumber || config?.phoneNumberId}</span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr] gap-2 items-center">
                            <span className="text-sm font-medium text-muted-foreground">Business Account ID:</span>
                            <span className="text-sm font-mono">{config?.wabaId}</span>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDisconnect}
                            disabled={isDisconnecting}
                        >
                            {isDisconnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Disconnect
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowForm(true)}
                        >
                            Edit Configuration
                        </Button>
                    </div>
                </div>

                {/* Webhook Configuration */}
                <div className="rounded-xl bg-muted/50 border border-border/50 p-4 space-y-3">
                    <div className="text-sm font-medium">Webhook Configuration</div>
                    <p className="text-sm text-muted-foreground">
                        Configure this Callback URL in your Meta App Dashboard under WhatsApp → Configuration.
                    </p>
                    <div className="space-y-3">
                        <div>
                            <Label className="text-xs text-muted-foreground">Callback URL</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <Input readOnly value={webhookUrl} className="font-mono text-xs" />
                                <Button variant="outline" size="icon" onClick={() => copyToClipboard(webhookUrl)}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Verify Token</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <Input readOnly value={verifyToken} className="font-mono text-xs" />
                                <Button variant="outline" size="icon" onClick={() => copyToClipboard(verifyToken)}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Test Section */}
                <div className="flex gap-2 pt-4 border-t">
                    <Input
                        placeholder="Test Phone (+1...)"
                        value={testPhone}
                        onChange={e => setTestPhone(e.target.value)}
                        className="w-[180px]"
                    />
                    <Button
                        variant="secondary"
                        onClick={handleTest}
                        disabled={isTesting || !testPhone}
                    >
                        {isTesting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="mr-2 h-4 w-4" />
                        )}
                        Send Test Message
                    </Button>
                </div>
            </div>
        );
    }

    // Setup Flow View (Not Connected or Editing)

    const handleEmbeddedSignup = async (data: { code: string; wabaId: string; phoneNumberId: string }) => {
        if (!onEmbeddedSignup) {
            toast.error('Embedded signup not configured');
            return;
        }
        setIsEmbeddedSignupLoading(true);
        try {
            await onEmbeddedSignup(data);
            toast.success('WhatsApp Business connected successfully!');
        } catch (error) {
            toast.error('Failed to complete connection');
        } finally {
            setIsEmbeddedSignupLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Description */}
            <div className="space-y-2">
                <h3 className="text-lg font-semibold">Meta WhatsApp Business API</h3>
                <p className="text-sm text-muted-foreground">
                    Connect using Meta's official WhatsApp Business API. This requires a verified business account and provides advanced features like message templates and business profiles.
                </p>
            </div>

            {/* Setup Card with Tabs */}
            <div className="rounded-xl border bg-card">
                {/* Header with WhatsApp Icon */}
                <div className="flex flex-col items-center justify-center py-8 border-b bg-muted/30">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                        <MessageSquare className="h-8 w-8 text-green-600" />
                    </div>
                    <h4 className="text-lg font-semibold">WhatsApp Business Setup</h4>
                    <p className="text-sm text-muted-foreground text-center max-w-md mt-1">
                        Connect your WhatsApp Business account to start receiving and sending messages through our platform.
                    </p>
                </div>

                {/* Tabbed Setup Options */}
                <div className="p-6">
                    <Tabs defaultValue="manual" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger
                                value="quick"
                                className="flex items-center gap-2 opacity-50 cursor-not-allowed"
                                disabled
                                onClick={() => toast.info('Coming Soon: Requires Meta Tech Provider Verification')}
                            >
                                <Zap className="h-4 w-4" />
                                Quick Connect (Coming Soon)
                            </TabsTrigger>
                            <TabsTrigger value="manual" className="flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                Manual Setup
                            </TabsTrigger>
                        </TabsList>

                        {/* Quick Connect Tab - Embedded Signup (Disabled for now) */}
                        <TabsContent value="quick" className="space-y-4">
                            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-4 mb-4">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    <strong>Recommended:</strong> Connect instantly with one click. We'll handle all the technical setup for you.
                                </p>
                            </div>

                            {isEmbeddedSignupLoading ? (
                                <div className="flex flex-col items-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                                    <p className="text-sm text-muted-foreground">Setting up your WhatsApp Business...</p>
                                </div>
                            ) : (
                                <MetaEmbeddedSignup
                                    onSuccess={handleEmbeddedSignup}
                                    onError={(error) => toast.error(error)}
                                />
                            )}
                        </TabsContent>

                        {/* Manual Setup Tab - Credential Form */}
                        <TabsContent value="manual" className="space-y-6">
                            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-4">
                                <h5 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                                    What you'll need:
                                </h5>
                                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                                    <li className="flex items-center gap-2">
                                        <span className="text-amber-500">•</span>
                                        A Facebook Business account
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-amber-500">•</span>
                                        A WhatsApp Business account
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-amber-500">•</span>
                                        Admin access to your business account
                                    </li>
                                </ul>
                            </div>

                            {/* Credential Fields */}
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="phoneNumberId">Phone Number ID *</Label>
                                    <Input
                                        id="phoneNumberId"
                                        value={phoneNumberId}
                                        onChange={e => setPhoneNumberId(e.target.value)}
                                        placeholder="100..."
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Find this in Meta Business Suite → WhatsApp → Phone Numbers
                                    </p>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="wabaId">WhatsApp Business Account ID *</Label>
                                    <Input
                                        id="wabaId"
                                        value={wabaId}
                                        onChange={e => setWabaId(e.target.value)}
                                        placeholder="200..."
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="accessToken">Permanent Access Token *</Label>
                                    <Input
                                        id="accessToken"
                                        type="password"
                                        value={accessToken}
                                        onChange={e => setAccessToken(e.target.value)}
                                        placeholder="EAAG..."
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Use a System User access token with <code className="px-1 py-0.5 bg-muted rounded text-xs">whatsapp_business_messaging</code> permission.
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4">
                                {(isConnected || showForm) && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowForm(false)}
                                    >
                                        Cancel
                                    </Button>
                                )}
                                <Button onClick={handleSave} disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Connect WhatsApp
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}

