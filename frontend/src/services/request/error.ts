import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { refresh } from '@/services/insight/auth';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/constants/auth';

const getRefreshToken = () => {
    try {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
        return null;
    }
};

const saveTokens = (accessToken: string, refreshToken: string) => {
    try {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } catch {
        /* ignore */
    }
};

const clearTokensAndRedirect = () => {
    try {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
        /* ignore */
    }
    if (typeof window === 'undefined') return;

    const base = (window as any).routerBase || '/';
    const normalizedBase = base.endsWith('/') ? base : `${base}/`;
    const loginPath = `${normalizedBase}login`;

    const { pathname, search } = window.location;
    const atLogin = pathname === loginPath || pathname === `${loginPath}/`;
    if (atLogin) return;

    const redirectTarget = `${pathname}${search}`;
    const redirect = redirectTarget ? `?redirect=${encodeURIComponent(redirectTarget)}` : '';
    window.location.href = `${loginPath}${redirect}`;
};

let refreshPromise: Promise<INSIGHT_API.RefreshResponse> | null = null;

export const errorConfig = {
    responseInterceptors: [[
        (response: AxiosResponse) => response,
        async (error: AxiosError) => {
            const { response, config } = error || {};
            const status = response?.status;

            if (status !== 401 || !config) {
                throw error;
            }

            // Avoid infinite loop on refresh endpoint or retried request
            if ((config as any)._retry || (config.url && config.url.includes('/auth/refresh'))) {
                clearTokensAndRedirect();
                throw error;
            }

            const currentRefresh = getRefreshToken();
            if (!currentRefresh) {
                clearTokensAndRedirect();
                throw error;
            }

            if (!refreshPromise) {
                refreshPromise = refresh({ refresh_token: currentRefresh }).finally(() => {
                    refreshPromise = null;
                });
            }

            const refreshResult = await refreshPromise;

            if (!refreshResult?.success || !refreshResult.access_token || !refreshResult.refresh_token) {
                clearTokensAndRedirect();
                throw error;
            }

            saveTokens(refreshResult.access_token, refreshResult.refresh_token);

            const retryConfig: AxiosRequestConfig = {
                ...config,
                headers: {
                    ...(config.headers || {}),
                    Authorization: `Bearer ${refreshResult.access_token}`,
                },
            } as AxiosRequestConfig & { _retry?: boolean };

            (retryConfig as any)._retry = true;

            return axios.request(retryConfig);
        },
    ]],

    errorHandler(error: any) {
        const { response } = error || {};
        if (response?.status === 401) {
            clearTokensAndRedirect();
            return;
        }
        throw error;
    },
};