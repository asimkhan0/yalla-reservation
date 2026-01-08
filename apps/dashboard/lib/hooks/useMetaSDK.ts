'use client';

import { useEffect, useState, useCallback } from 'react';

// Extend window to include Facebook SDK
declare global {
    interface Window {
        FB: {
            init: (params: {
                appId: string;
                cookie?: boolean;
                xfbml?: boolean;
                version: string;
            }) => void;
            login: (
                callback: (response: FacebookLoginResponse) => void,
                options?: FacebookLoginOptions
            ) => void;
            getLoginStatus: (callback: (response: FacebookLoginResponse) => void) => void;
        };
        fbAsyncInit: () => void;
    }
}

interface FacebookLoginOptions {
    config_id: string;
    response_type: string;
    override_default_response_type: boolean;
    extras?: {
        setup?: Record<string, unknown>;
        featureType?: string;
        sessionInfoVersion?: number;
    };
}

interface FacebookLoginResponse {
    status: 'connected' | 'not_authorized' | 'unknown';
    authResponse?: {
        code?: string;
        accessToken?: string;
        expiresIn?: number;
        signedRequest?: string;
        userID?: string;
    };
}

interface EmbeddedSignupResponse {
    code: string;
    waba_id?: string;
    phone_number_id?: string;
}

interface UseMetaSDKReturn {
    isReady: boolean;
    isLoading: boolean;
    error: string | null;
    launchEmbeddedSignup: () => Promise<EmbeddedSignupResponse>;
}

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID || '';
const META_CONFIG_ID = process.env.NEXT_PUBLIC_META_CONFIG_ID || '';

export function useMetaSDK(): UseMetaSDKReturn {
    const [isReady, setIsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Skip if SDK is already loaded
        if (window.FB) {
            setIsReady(true);
            setIsLoading(false);
            return;
        }

        // Skip if no App ID configured
        if (!META_APP_ID) {
            setError('META_APP_ID not configured');
            setIsLoading(false);
            return;
        }

        // Define callback for when SDK loads
        window.fbAsyncInit = function () {
            window.FB.init({
                appId: META_APP_ID,
                cookie: true,
                xfbml: true,
                version: 'v21.0'
            });
            setIsReady(true);
            setIsLoading(false);
        };

        // Load SDK script
        const loadScript = () => {
            const script = document.createElement('script');
            script.id = 'facebook-jssdk';
            script.src = 'https://connect.facebook.net/en_US/sdk.js';
            script.async = true;
            script.defer = true;
            script.crossOrigin = 'anonymous';

            script.onerror = () => {
                setError('Failed to load Facebook SDK');
                setIsLoading(false);
            };

            document.body.appendChild(script);
        };

        // Only load if script doesn't exist
        if (!document.getElementById('facebook-jssdk')) {
            loadScript();
        }

        // Cleanup
        return () => {
            // Note: We don't remove the script as FB SDK should persist
        };
    }, []);

    const launchEmbeddedSignup = useCallback((): Promise<EmbeddedSignupResponse> => {
        return new Promise((resolve, reject) => {
            if (!isReady || !window.FB) {
                reject(new Error('Facebook SDK not ready'));
                return;
            }

            if (!META_CONFIG_ID) {
                reject(new Error('META_CONFIG_ID not configured'));
                return;
            }

            // Session info listener for Embedded Signup data
            const sessionInfoListener = (event: MessageEvent) => {
                if (event.origin !== 'https://www.facebook.com' &&
                    event.origin !== 'https://web.facebook.com') {
                    return;
                }

                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'WA_EMBEDDED_SIGNUP') {
                        // Extract WABA and Phone Number IDs from session info
                        if (data.data.phone_number_id && data.data.waba_id) {
                            window.removeEventListener('message', sessionInfoListener);
                            // Store for later use in the login callback
                            (window as any).__embeddedSignupData = {
                                waba_id: data.data.waba_id,
                                phone_number_id: data.data.phone_number_id
                            };
                        }
                    }
                } catch {
                    // Not a JSON message, ignore
                }
            };

            window.addEventListener('message', sessionInfoListener);

            window.FB.login(
                (response: FacebookLoginResponse) => {
                    window.removeEventListener('message', sessionInfoListener);

                    if (response.authResponse?.code) {
                        const embeddedData = (window as any).__embeddedSignupData || {};
                        resolve({
                            code: response.authResponse.code,
                            waba_id: embeddedData.waba_id,
                            phone_number_id: embeddedData.phone_number_id
                        });
                        delete (window as any).__embeddedSignupData;
                    } else {
                        reject(new Error('User cancelled or authorization failed'));
                    }
                },
                {
                    config_id: META_CONFIG_ID,
                    response_type: 'code',
                    override_default_response_type: true,
                    extras: {
                        setup: {},
                        featureType: '',
                        sessionInfoVersion: 3
                    }
                }
            );
        });
    }, [isReady]);

    return {
        isReady,
        isLoading,
        error,
        launchEmbeddedSignup
    };
}
