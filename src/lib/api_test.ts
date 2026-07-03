// src/lib/api.ts
import { Capacitor } from '@capacitor/core';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const isNative = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'
const isAndroid = platform === 'android';



interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  details?: Record<string, string[]>;
}

let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (handler: () => void) => {
  onUnauthorized = handler;
};

const buildHeaders = async (
  token?: string,
  isGuest = false,
  guestId?: string,
  isFormData = false,
  isAuthRequest = false
) => {
  const headers: Record<string, string> = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';

  let effectiveToken = token;
  if (isAndroid && isAuthRequest && !effectiveToken) {
    try {
      const stored = await SecureStorage.get('auth_token');
      if (stored) effectiveToken = stored;
    } catch {}
  }
  if (effectiveToken && (!isAuthRequest || isNative)) {
    headers['Authorization'] = `Bearer ${effectiveToken}`;
  }
  if (isGuest && guestId) headers['X-Guest-Id'] = guestId;
  return headers;
};

const handleUnauthorized = () => {
  onUnauthorized?.();
};

export const apiClient = {
  post: async <T = unknown>(
    endpoint: string,
    data: unknown,
    token?: string,
    guestId?: string,
    isAuthRequest = false
  ): Promise<ApiResponse<T>> => {
    const isGuestRequest =
      endpoint.includes('/guest-booking') ||
      endpoint.includes('/cancel') ||
      endpoint.includes('/rate') ||
      guestId !== undefined;
    try {
      const headers = await buildHeaders(token, isGuestRequest, guestId, false, isAuthRequest);
      const fetchOptions: RequestInit = {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      };
      if (isAuthRequest) fetchOptions.credentials = isNative ? 'omit' : 'include';

      const res = await fetch(`${API_BASE}${endpoint}`, fetchOptions);

      if (res.status === 401) {
        handleUnauthorized();
        return { status: 'error', message: 'Unauthorized' };
      }

      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          status: 'error',
          message: responseData.message || `HTTP error! status: ${res.status}`,
          details: responseData.details,
        };
      }
      return responseData;
    } catch (error) {
      console.error('API POST Error:', error);
      return { status: 'error', message: error instanceof Error ? error.message : 'Network error' };
    }
  },

  get: async <T = unknown>(
    endpoint: string,
    token?: string,
    isGuest = false,
    guestId?: string,
    isAuthRequest = false
  ): Promise<ApiResponse<T>> => {
    try {
      const headers = await buildHeaders(token, isGuest, guestId, false, isAuthRequest);
      const fetchOptions: RequestInit = { headers };
      if (isAuthRequest) fetchOptions.credentials = isNative ? 'omit' : 'include';

      const res = await fetch(`${API_BASE}${endpoint}`, fetchOptions);

      if (res.status === 401) {
        handleUnauthorized();
        return { status: 'error', message: 'Unauthorized' };
      }

      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          status: 'error',
          message: responseData.message || `HTTP error! status: ${res.status}`,
          details: responseData.details,
        };
      }
      return responseData;
    } catch (error) {
      console.error('API GET Error:', error);
      return { status: 'error', message: error instanceof Error ? error.message : 'Network error' };
    }
  },

  patch: async <T = unknown>(
    endpoint: string,
    data: FormData | Record<string, unknown>,
    token?: string,
    isAuthRequest = false
  ): Promise<ApiResponse<T>> => {
    const isFormData = data instanceof FormData;
    try {
      const headers = await buildHeaders(token, false, undefined, isFormData, isAuthRequest);
      const fetchOptions: RequestInit = {
        method: 'PATCH',
        headers,
        body: isFormData ? data : JSON.stringify(data),
      };
      if (isAuthRequest) fetchOptions.credentials = isNative ? 'omit' : 'include';

      const res = await fetch(`${API_BASE}${endpoint}`, fetchOptions);

      if (res.status === 401) {
        handleUnauthorized();
        return { status: 'error', message: 'Unauthorized' };
      }

      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          status: 'error',
          message: responseData.message || `HTTP error! status: ${res.status}`,
          details: responseData.details,
        };
      }
      return responseData;
    } catch (error) {
      console.error('API PATCH Error:', error);
      return { status: 'error', message: error instanceof Error ? error.message : 'Network error' };
    }
  },

  delete: async <T = unknown>(
    endpoint: string,
    token?: string,
    isAuthRequest = false
  ): Promise<ApiResponse<T>> => {
    try {
      const headers = await buildHeaders(token, false, undefined, false, isAuthRequest);
      const fetchOptions: RequestInit = { method: 'DELETE', headers };
      if (isAuthRequest) fetchOptions.credentials = isNative ? 'omit' : 'include';

      const res = await fetch(`${API_BASE}${endpoint}`, fetchOptions);

      if (res.status === 401) {
        handleUnauthorized();
        return { status: 'error', message: 'Unauthorized' };
      }

      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          status: 'error',
          message: responseData.message || `HTTP error! status: ${res.status}`,
        };
      }
      return responseData;
    } catch (error) {
      console.error('API DELETE Error:', error);
      return { status: 'error', message: error instanceof Error ? error.message : 'Network error' };
    }
  },
};












