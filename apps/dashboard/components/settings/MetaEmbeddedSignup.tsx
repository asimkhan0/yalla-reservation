'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Facebook, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { useMetaSDK } from '@/lib/hooks/useMetaSDK';

interface MetaEmbeddedSignupProps {
    onSuccess: (data: {
        code: string;
        wabaId: string;
        phoneNumberId: string
    }) => void;
    onError?: (error: string) => void;
}

export function MetaEmbeddedSignup({ onSuccess, onError }: MetaEmbeddedSignupProps) {
    const { isReady, isLoading: sdkLoading, error: sdkError, launchEmbeddedSignup } = useMetaSDK();
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConnect = async () => {
        setError(null);
        setIsConnecting(true);

        try {
            const response = await launchEmbeddedSignup();

            if (!response.waba_id || !response.phone_number_id) {
                throw new Error('Failed to get WhatsApp Business Account details. Please try again.');
            }

            onSuccess({
                code: response.code,
                wabaId: response.waba_id,
                phoneNumberId: response.phone_number_id
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Connection failed';
            setError(errorMessage);
            onError?.(errorMessage);
        } finally {
            setIsConnecting(false);
        }
    };

    // SDK configuration error
    if (sdkError) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    <div className="space-y-2">
                        <p>Facebook SDK configuration error: {sdkError}</p>
                        <p className="text-sm opacity-80">
                            Please ensure <code>NEXT_PUBLIC_META_APP_ID</code> and{' '}
                            <code>NEXT_PUBLIC_META_CONFIG_ID</code> are configured.
                        </p>
                    </div>
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            {/* Requirements List */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                    What you&apos;ll need:
                </h4>
                <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>A Facebook Business account</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Admin access to your business</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>A phone number for WhatsApp Business</span>
                    </li>
                </ul>
            </div>

            {/* Error Display */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Connect Button */}
            <Button
                onClick={handleConnect}
                disabled={!isReady || sdkLoading || isConnecting}
                className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white"
                size="lg"
            >
                {sdkLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                    </>
                ) : isConnecting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                    </>
                ) : (
                    <>
                        <Facebook className="mr-2 h-4 w-4" />
                        Continue with Facebook
                    </>
                )}
            </Button>

            {/* Help Text */}
            <p className="text-xs text-muted-foreground text-center">
                By connecting, you agree to let DineLine manage your WhatsApp Business messages.{' '}
                <a
                    href="https://www.facebook.com/policies/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground inline-flex items-center gap-0.5"
                >
                    Privacy Policy
                    <ExternalLink className="h-3 w-3" />
                </a>
            </p>
        </div>
    );
}
