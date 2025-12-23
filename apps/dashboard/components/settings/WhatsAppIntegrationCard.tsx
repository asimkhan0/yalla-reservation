'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { RestaurantService, WhatsAppConfig } from '../../lib/services/restaurant.service';
import { API_URL } from '../../lib/utils';
import { CheckCircle2, Copy, AlertCircle, Loader2 } from 'lucide-react';

interface WhatsAppIntegrationCardProps {
    restaurantId: string;
    initialConfig?: WhatsAppConfig;
}

export function WhatsAppIntegrationCard({ restaurantId, initialConfig }: WhatsAppIntegrationCardProps) {
    const [provider, setProvider] = useState<'twilio' | 'meta'>(initialConfig?.provider || 'twilio');
    const [isLoading, setIsLoading] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    // Form States
    // Twilio
    const [accountSid, setAccountSid] = useState(initialConfig?.accountSid || '');
    const [authToken, setAuthToken] = useState(initialConfig?.authToken || '');
    const [twilioPhone, setTwilioPhone] = useState(initialConfig?.phoneNumber || '');

    // Meta
    const [phoneNumberId, setPhoneNumberId] = useState(initialConfig?.phoneNumberId || '');
    const [wabaId, setWabaId] = useState(initialConfig?.wabaId || '');
    const [accessToken, setAccessToken] = useState(initialConfig?.accessToken || '');

    // Test
    const [testPhone, setTestPhone] = useState('');

    const webhookUrl = provider === 'twilio'
        ? `${API_URL}/whatsapp/webhooks/twilio/${restaurantId}`
        : `${API_URL}/whatsapp/webhooks/meta/${restaurantId}`;

    const metaVerifyToken = initialConfig?.provider === 'meta' ? 'REVEALED_ON_SAVE' : 'Generate on Save';

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const config: WhatsAppConfig = {
                enabled: true,
                provider,
                ...(provider === 'twilio' ? {
                    accountSid,
                    authToken,
                    phoneNumber: twilioPhone
                } : {
                    phoneNumberId,
                    wabaId,
                    accessToken
                })
            };

            await RestaurantService.updateIntegration(restaurantId, config);
            alert('Configuration saved successfully!');
        } catch (error: any) {
            console.error(error);
            alert('Failed to save configuration: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTest = async () => {
        setIsTesting(true);
        try {
            await RestaurantService.testConnection(restaurantId, 'Hello from Yalla Reservation!', testPhone);
            alert('Test message sent!');
        } catch (error: any) {
            console.warn(error);
            alert('Test failed. Check console for details.');
        } finally {
            setIsTesting(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard');
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    WhatsApp Integration
                    {initialConfig?.enabled && (
                        <Badge variant="success" className="font-normal">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                        </Badge>
                    )}
                </CardTitle>
                <CardDescription>
                    Connect your WhatsApp Business account to enable AI agent responses.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Provider Selection */}
                <div className="space-y-3">
                    <Label>Select Provider</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div
                            className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${provider === 'twilio'
                                    ? 'border-primary bg-primary/10 ring-1 ring-primary'
                                    : 'border-border hover:bg-muted/50'
                                }`}
                            onClick={() => setProvider('twilio')}
                        >
                            <div className="font-semibold">Twilio</div>
                            <div className="text-sm text-muted-foreground mt-1">Easiest setup. Managed compliance.</div>
                        </div>
                        <div
                            className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${provider === 'meta'
                                    ? 'border-primary bg-primary/10 ring-1 ring-primary'
                                    : 'border-border hover:bg-muted/50'
                                }`}
                            onClick={() => setProvider('meta')}
                        >
                            <div className="font-semibold">Meta Cloud API</div>
                            <div className="text-sm text-muted-foreground mt-1">Official API. Lower cost.</div>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Dynamic Form */}
                <div className="space-y-4">
                    {provider === 'twilio' ? (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="accountSid">Account SID</Label>
                                <Input id="accountSid" value={accountSid} onChange={e => setAccountSid(e.target.value)} placeholder="AC..." />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="authToken">Auth Token</Label>
                                <Input id="authToken" type="password" value={authToken} onChange={e => setAuthToken(e.target.value)} placeholder="••••••••" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="twilioPhone">WhatsApp Number</Label>
                                <Input id="twilioPhone" value={twilioPhone} onChange={e => setTwilioPhone(e.target.value)} placeholder="+1234567890" />
                                <p className="text-xs text-muted-foreground">Include country code. Ensure it matches your Twilio sender.</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="phoneNumberId">Phone Number ID</Label>
                                <Input id="phoneNumberId" value={phoneNumberId} onChange={e => setPhoneNumberId(e.target.value)} placeholder="100..." />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="wabaId">WhatsApp Business Account ID</Label>
                                <Input id="wabaId" value={wabaId} onChange={e => setWabaId(e.target.value)} placeholder="200..." />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="accessToken">Permanent Access Token</Label>
                                <Input id="accessToken" type="password" value={accessToken} onChange={e => setAccessToken(e.target.value)} placeholder="EAAG..." />
                                <p className="text-xs text-muted-foreground">Use a System User access token with `whatsapp_business_messaging` permission.</p>
                            </div>
                        </>
                    )}
                </div>

                {/* Webhook Info */}
                <div className="rounded-xl bg-muted/50 border border-border/50 p-4 space-y-3">
                    <div className="text-sm font-medium">Webhook Configuration</div>
                    <div className="text-sm text-muted-foreground">
                        {provider === 'twilio'
                            ? "Paste this URL into 'A message comes in' section of your Twilio Phone Number settings."
                            : "Configure this Callback URL in your Meta App Dashboard under WhatsApp > Configuration."}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <Input readOnly value={webhookUrl} className="font-mono text-xs" />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(webhookUrl)}>
                            <span className="sr-only">Copy</span>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                    {provider === 'meta' && (
                        <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1">
                                <Label className="text-xs text-muted-foreground">Verify Token</Label>
                                <Input readOnly value={metaVerifyToken} className="font-mono text-xs mt-1" />
                            </div>
                            <div className="self-end pb-1 text-xs text-muted-foreground">
                                (Generated after saving)
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between border-t border-border/50 p-6">
                <div className="flex gap-2 w-full sm:w-auto">
                    <Input
                        placeholder="Test Phone (+1...)"
                        value={testPhone}
                        onChange={e => setTestPhone(e.target.value)}
                        className="w-[180px]"
                    />
                    <Button variant="secondary" onClick={handleTest} disabled={isTesting || !testPhone}>
                        {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Test'}
                    </Button>
                </div>
                <Button onClick={handleSave} disabled={isLoading} className="w-full sm:w-auto">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Configuration'}
                </Button>
            </CardFooter>
        </Card>
    );
}
