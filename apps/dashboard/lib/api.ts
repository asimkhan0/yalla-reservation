import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from './utils';
import { clearAuthCookies, setAuthCookies } from './cookies';

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Extracts a user-friendly error message from various error response formats.
 * Supports:
 * - New structured format: { error: { code, message } }
 * - Legacy format: { error: "message" }
 * - Alternative format: { message: "..." }
 * - Axios errors
 */
export const extractErrorMessage = (error: any, defaultMessage = 'Something went wrong'): string => {
    // Check for axios response error
    if (error?.response?.data) {
        const data = error.response.data;

        // New structured format: { error: { code, message } }
        if (data.error?.message) {
            return data.error.message;
        }

        // Legacy format: { error: "message" }
        if (typeof data.error === 'string') {
            return data.error;
        }

        // Alternative format: { message: "..." }
        if (data.message) {
            return data.message;
        }
    }

    // Network or axios errors
    if (error?.message && !error.message.includes('status code')) {
        return error.message;
    }

    return defaultMessage;
};

// Auth endpoints that should NOT trigger token refresh on 401
const authEndpoints = ['/auth/login', '/auth/register', '/auth/refresh'];

// Request interceptor: Attach access token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 & Refresh Token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const requestUrl = originalRequest?.url || '';

        // Skip token refresh for auth endpoints (401 means invalid credentials, not expired token)
        const isAuthEndpoint = authEndpoints.some(endpoint => requestUrl.includes(endpoint));
        if (isAuthEndpoint) {
            return Promise.reject(error);
        }

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');

                if (!refreshToken) {
                    throw new Error('Session expired');
                }

                // Call refresh endpoint
                // Note: We use a fresh axios instance to avoid infinite loops
                const { data } = await axios.post(`${API_URL}/auth/refresh`, {
                    refreshToken,
                });

                // Update tokens in localStorage
                localStorage.setItem('accessToken', data.accessToken);

                // Update cookies for SSR middleware
                setAuthCookies(data.accessToken, refreshToken);

                // Update header and retry original request
                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                return api(originalRequest);

            } catch (refreshError) {
                // Refresh failed - logout user
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                localStorage.removeItem('restaurant');

                // Clear cookies for SSR middleware
                clearAuthCookies();

                // Redirect to login
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;

