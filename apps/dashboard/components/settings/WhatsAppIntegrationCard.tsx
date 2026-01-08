'use client';

import { useState } from 'react';
import { toast } from "@/components/ui/sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { RestaurantService, WhatsAppConfig } from '../../lib/services/restaurant.service';
import { API_URL } from '../../lib/utils';
import { CheckCircle2, Smartphone, Cloud } from 'lucide-react';
import { TwilioSetupForm } from './TwilioSetupForm';
import { MetaSetupForm } from './MetaSetupForm';

interface WhatsAppIntegrationCardProps {
    restaurantId: string;
    initialConfig?: WhatsAppConfig;
}

export function WhatsAppIntegrationCard({ restaurantId, initialConfig }: WhatsAppIntegrationCardProps) {
    const [config, setConfig] = useState<WhatsAppConfig | undefined>(initialConfig);
    const [activeTab, setActiveTab] = useState<'twilio' | 'meta'>(
        initialConfig?.provider || 'twilio'
    );

    // Determine connection status for each provider
    const isTwilioConnected = config?.provider === 'twilio' && config?.enabled;
    const isMetaConnected = config?.provider === 'meta' && config?.enabled;
    const hasAnyConnection = isTwilioConnected || isMetaConnected;

    // Generate webhook URLs
    const twilioWebhookUrl = `${API_URL}/whatsapp/webhooks/twilio/${restaurantId}`;
    const metaWebhookUrl = `${API_URL}/whatsapp/webhooks/meta/${restaurantId}`;

    // Handle Twilio Save
    const handleTwilioSave = async (twilioConfig: {
        accountSid?: string;
        authToken?: string;
        phoneNumber?: string;
        enabled?: boolean;
    }) => {
        try {
            const newConfig: WhatsAppConfig = {
                enabled: true,
                provider: 'twilio',
                accountSid: twilioConfig.accountSid,
                authToken: twilioConfig.authToken,
                phoneNumber: twilioConfig.phoneNumber
            };

            await RestaurantService.updateIntegration(restaurantId, newConfig);
            setConfig(newConfig);
            toast.success('Twilio configuration saved successfully!');
        } catch (error: any) {
            console.error(error);
            toast.error('Failed to save configuration: ' + error.message);
            throw error;
        }
    };

    // Handle Meta Save (with verification)
    const handleMetaSave = async (metaConfig: {
        phoneNumberId?: string;
        wabaId?: string;
        accessToken?: string;
        enabled?: boolean;
    }) => {
        try {
            // First, verify the credentials with Meta Graph API
            const verifyResult = await RestaurantService.verifyMetaConnection(
                metaConfig.phoneNumberId!,
                metaConfig.accessToken!
            );

            if (!verifyResult.valid) {
                throw new Error(verifyResult.error || 'Invalid Meta credentials');
            }

            // Build config with verified business info
            const newConfig: WhatsAppConfig = {
                enabled: true,
                provider: 'meta',
                phoneNumberId: metaConfig.phoneNumberId,
                wabaId: metaConfig.wabaId,
                accessToken: metaConfig.accessToken,
                // Store verified business info
                businessName: verifyResult.verifiedName,
                displayPhoneNumber: verifyResult.displayPhoneNumber
            };

            // Save and get the response with the generated webhookVerifyToken
            const savedRestaurant = await RestaurantService.updateIntegration(restaurantId, newConfig);

            // Extract the webhookVerifyToken from the saved config
            const savedConfig = savedRestaurant?.whatsappConfig;

            // Update local state with the actual verify token from backend
            setConfig({
                ...newConfig,
                webhookVerifyToken: savedConfig?.webhookVerifyToken || 'Refresh page to see token'
            });
            toast.success(`Connected to ${verifyResult.verifiedName || 'WhatsApp Business'}!`);
        } catch (error: any) {
            console.error(error);
            toast.error('Failed to connect: ' + (error.message || 'Unknown error'));
            throw error;
        }
    };

    // Handle Disconnect
    const handleDisconnect = async () => {
        try {
            await RestaurantService.disconnect(restaurantId);
            setConfig(undefined);
            toast.success('WhatsApp disconnected successfully');
        } catch (error: any) {
            console.error(error);
            toast.error('Failed to disconnect: ' + error.message);
            throw error;
        }
    };

    // Handle Embedded Signup (One-Click Connection)
    const handleEmbeddedSignup = async (data: { code: string; wabaId: string; phoneNumberId: string }) => {
        try {
            const result = await RestaurantService.exchangeEmbeddedSignupToken(
                data.code,
                data.wabaId,
                data.phoneNumberId
            );

            if (!result.success) {
                throw new Error(result.error || 'Failed to complete signup');
            }

            // Update local state with connected config
            setConfig({
                enabled: true,
                provider: 'meta',
                phoneNumberId: data.phoneNumberId,
                wabaId: data.wabaId,
                businessName: result.businessName,
                displayPhoneNumber: result.displayPhoneNumber,
                webhookVerifyToken: result.webhookVerifyToken
            });

            toast.success(`Connected to ${result.businessName || 'WhatsApp Business'}!`);
        } catch (error: any) {
            console.error('[Embedded Signup Error]', error);
            toast.error('Connection failed: ' + (error.message || 'Unknown error'));
            throw error;
        }
    };

    // Handle Test Message
    const handleTest = async (testPhone: string) => {
        console.log('[WhatsAppIntegrationCard] Testing with restaurantId:', restaurantId);
        try {
            await RestaurantService.testConnection(restaurantId, 'Hello from DineLine!', testPhone);
            toast.success('Test message sent!');
        } catch (error: any) {
            console.error(error);
            toast.error('Test failed: ' + error.message);
            throw error;
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            WhatsApp Integration
                            {hasAnyConnection && (
                                <Badge variant="success" className="font-normal">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Active
                                </Badge>
                            )}
                        </CardTitle>
                        <CardDescription className="mt-1.5">
                            Connect your WhatsApp Business account to enable AI agent responses.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'twilio' | 'meta')}>
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="twilio" className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            <span>Twilio</span>
                            {isTwilioConnected && (
                                <Badge variant="success" className="ml-1 h-5 px-1.5 text-[10px]">
                                    Connected
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="meta" className="flex items-center gap-2">
                            <Cloud className="h-4 w-4" />
                            <span>Meta Business API</span>
                            {isMetaConnected && (
                                <Badge variant="success" className="ml-1 h-5 px-1.5 text-[10px]">
                                    Connected
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="twilio" className="mt-0">
                        <TwilioSetupForm
                            restaurantId={restaurantId}
                            config={isTwilioConnected ? {
                                accountSid: config?.accountSid,
                                authToken: config?.authToken,
                                phoneNumber: config?.phoneNumber,
                                enabled: config?.enabled
                            } : undefined}
                            webhookUrl={twilioWebhookUrl}
                            onSave={handleTwilioSave}
                            onTest={handleTest}
                        />
                    </TabsContent>

                    <TabsContent value="meta" className="mt-0">
                        <MetaSetupForm
                            restaurantId={restaurantId}
                            config={isMetaConnected ? {
                                phoneNumberId: config?.phoneNumberId,
                                wabaId: config?.wabaId,
                                accessToken: config?.accessToken,
                                webhookVerifyToken: config?.webhookVerifyToken,
                                businessName: config?.businessName,
                                displayPhoneNumber: config?.displayPhoneNumber,
                                enabled: config?.enabled
                            } : undefined}
                            webhookUrl={metaWebhookUrl}
                            onSave={handleMetaSave}
                            onDisconnect={handleDisconnect}
                            onTest={handleTest}
                            onEmbeddedSignup={handleEmbeddedSignup}
                        />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
