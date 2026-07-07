// src/lib/api.ts
import { Capacitor } from '@capacitor/core';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const isNative = Capacitor.isNativePlatform();

// --- In-Memory Token Cache & Boot Lock ---
let memoryToken: string | null = null;
let isBootComplete = false;
let bootResolvers: Array<() => void> = [];

export const setMemoryToken = (token: string | null) => {
  memoryToken = token;
};

export const signalBootComplete = () => {
  isBootComplete = true;
  bootResolvers.forEach(resolve => resolve());
  bootResolvers = [];
};

const waitForBoot = () => {
  if (isBootComplete) return Promise.resolve();
  return new Promise<void>((resolve) => {
    bootResolvers.push(resolve);
  });
};

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

// buildHeaders is now fully synchronous (0ms execution time)
const buildHeaders = (
  token?: string,
  isGuest = false,
  guestId?: string,
  isFormData = false,
  isAuthRequest = false
) => {
  const headers: Record<string, string> = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';

  // 1. Passed token > 2. Memory Token. 
  // WE NO LONGER READ FROM SECURE STORAGE HERE!
  const effectiveToken = token ?? memoryToken;
  
  if (effectiveToken && (!isAuthRequest || isNative)) {
    headers['Authorization'] = `Bearer ${effectiveToken}`;
  }
  if (isGuest && guestId) headers['X-Guest-Id'] = guestId;
  return headers;
};

const handleUnauthorized = () => {
  memoryToken = null; // Clear memory cache on 401
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
    await waitForBoot(); // Prevent race conditions on app launch
    
    const isGuestRequest =
      endpoint.includes('/guest-booking') ||
      endpoint.includes('/cancel') ||
      endpoint.includes('/rate') ||
      guestId !== undefined;
      
    try {
      const headers = buildHeaders(token, isGuestRequest, guestId, false, isAuthRequest);
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
    await waitForBoot();
    try {
      const headers = buildHeaders(token, isGuest, guestId, false, isAuthRequest);
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
    await waitForBoot();
    const isFormData = data instanceof FormData;
    try {
      const headers = buildHeaders(token, false, undefined, isFormData, isAuthRequest);
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
    await waitForBoot();
    try {
      const headers = buildHeaders(token, false, undefined, false, isAuthRequest);
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