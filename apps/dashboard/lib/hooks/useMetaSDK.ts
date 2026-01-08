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
        feature?: string;
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
        // Redundant production logging setup
        const addDiagnosticLog = (msg: string, data?: any) => {
            (window as any).__metaLogs = (window as any).__metaLogs || [];
            (window as any).__metaLogs.push({ time: new Date().toISOString(), msg, data });
            console.info(`[Meta SDK Diagnostic] ${msg}`, data || '');
        };

        addDiagnosticLog('Hook initialized', {
            hasAppId: !!META_APP_ID,
            hasConfigId: !!META_CONFIG_ID,
            sdkLoaded: !!window.FB
        });

        // Skip if SDK is already loaded
        if (window.FB) {
            addDiagnosticLog('SDK already present on window');
            setIsReady(true);
            setIsLoading(false);
            return;
        }

        // Skip if no App ID configured
        if (!META_APP_ID) {
            addDiagnosticLog('ERROR: META_APP_ID is missing');
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

            // Persistent listener for diagnostics
            const sessionInfoListener = (event: MessageEvent) => {
                const addDiagnosticLog = (msg: string, data?: any) => {
                    (window as any).__metaLogs = (window as any).__metaLogs || [];
                    (window as any).__metaLogs.push({ time: new Date().toISOString(), msg, data });
                    console.info(`[Meta SDK Diagnostic] ${msg}`, data || '');
                };

                // Capture everything for a snippet to see what's actually moving
                let data: any = null;
                try {
                    data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                } catch (e) { }

                const isFromFacebook = event.origin.includes('facebook.com');

                // EXTRA AGGRESSIVE: Log raw string if it's from FB
                if (isFromFacebook) {
                    addDiagnosticLog('RAW FACEBOOK STRING SNIFF', {
                        origin: event.origin,
                        raw: event.data
                    });
                }

                addDiagnosticLog(`Incoming message raw check (${isFromFacebook ? 'FB' : 'Non-FB'})`, {
                    origin: event.origin,
                    dataType: typeof event.data,
                    dataKeys: data && typeof data === 'object' ? Object.keys(data) : 'n/a',
                    // Log a sanitized snippet of the data if it's a string
                    rawSnippet: typeof event.data === 'string' ? event.data.substring(0, 150) : 'n/a',
                    typeField: data?.type || 'none',
                    isWhatsApp: (typeof event.data === 'string' && event.data.includes('WA_')) || (data?.type?.includes('WA_'))
                });

                // Meta documented origins + current origin (for SDK proxies)
                const allowedOrigins = [
                    'https://www.facebook.com',
                    'https://web.facebook.com',
                    'https://business.facebook.com',
                    'https://facebook.com',
                    window.location.origin
                ];

                // For diagnostics, we only skip if it looks completely unrelated
                const looksRelevant = (data?.type?.startsWith('WA_')) || (typeof event.data === 'string' && event.data.includes('WA_'));

                if (!allowedOrigins.includes(event.origin) && !looksRelevant && !isFromFacebook) {
                    return;
                }

                addDiagnosticLog('Analyzing Facebook/Relevant message', {
                    origin: event.origin,
                    type: data?.type,
                    keys: data && typeof data === 'object' ? Object.keys(data) : 'n/a'
                });

                if (data && data.type === 'WA_EMBEDDED_SIGNUP') {
                    addDiagnosticLog('Captured WA_EMBEDDED_SIGNUP data', data.data);

                    // Extract WABA and Phone Number IDs from session info
                    if (data.data?.phone_number_id && data.data?.waba_id) {
                        (window as any).__embeddedSignupData = {
                            waba_id: data.data.waba_id,
                            phone_number_id: data.data.phone_number_id
                        };
                        addDiagnosticLog('Stored IDs for final callback');
                    } else {
                        console.warn('[Meta SDK Diagnostic] WA_EMBEDDED_SIGNUP missing IDs', data.data);
                    }
                }
            };

            window.addEventListener('message', sessionInfoListener);

            window.FB.login(
                (response: FacebookLoginResponse) => {
                    const addDiagnosticLog = (msg: string, data?: any) => {
                        (window as any).__metaLogs = (window as any).__metaLogs || [];
                        (window as any).__metaLogs.push({ time: new Date().toISOString(), msg, data });
                        console.info(`[Meta SDK Diagnostic] ${msg}`, data || '');
                    };

                    addDiagnosticLog('FB.login callback triggered', { status: response.status });

                    // Handle the logic in an IIFE so the main callback is not async
                    (async () => {
                        if (response.authResponse?.code) {
                            // Sometimes the postMessage arrives slightly after the popup closes
                            if (!(window as any).__embeddedSignupData) {
                                addDiagnosticLog('Auth code received but signup data missing, waiting 1.5s...');
                                await new Promise(r => setTimeout(r, 1500));
                            }

                            const embeddedData = (window as any).__embeddedSignupData || {};
                            addDiagnosticLog('Finalizing signup with state', {
                                hasWabaId: !!embeddedData.waba_id,
                                hasPhoneId: !!embeddedData.phone_number_id,
                                rawEmbeddedData: embeddedData
                            });

                            window.removeEventListener('message', sessionInfoListener);

                            if (embeddedData.waba_id && embeddedData.phone_number_id) {
                                resolve({
                                    code: response.authResponse.code,
                                    waba_id: embeddedData.waba_id,
                                    phone_number_id: embeddedData.phone_number_id
                                });
                            } else {
                                // Specific error for when we have a code but no WhatsApp data
                                // This almost always means the Config ID is for "FB Login" not "WhatsApp Embedded Signup"
                                const errorMsg = 'Connected to Facebook, but WhatsApp data was not received. Please verify your Meta "Configuration ID" is set to "WhatsApp Embedded Signup" type.';
                                addDiagnosticLog('Failed: Code received but Data missing');
                                reject(new Error(errorMsg));
                            }
                            delete (window as any).__embeddedSignupData;
                        } else {
                            window.removeEventListener('message', sessionInfoListener);
                            addDiagnosticLog('Login failed or cancelled', { response, finalEmbeddedState: (window as any).__embeddedSignupData });
                            reject(new Error('User cancelled or authorization failed'));
                        }
                    })();
                },
                {
                    config_id: META_CONFIG_ID,
                    response_type: 'code',
                    override_default_response_type: true,
                    extras: {
                        setup: {},
                        feature: 'whatsapp_embedded_signup',
                        sessionInfoVersion: 2
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
