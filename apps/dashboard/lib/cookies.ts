// Cookie utility functions for auth

/**
 * Set auth cookies after login/register
 * Sets the accessToken cookie that can be read by middleware
 */
export function setAuthCookies(accessToken: string, refreshToken: string) {
    // Set accessToken cookie - readable by middleware
    // Using a long expiry since we also store in localStorage for API calls
    document.cookie = `accessToken=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    document.cookie = `refreshToken=${refreshToken}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

/**
 * Clear auth cookies on logout
 */
export function clearAuthCookies() {
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}
