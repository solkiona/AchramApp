// src/lib/api.ts
const API_BASE = 'https://api.achrams.com.ng/v1';

// Define the generic API response structure
interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message: string;
   T;
}

const buildHeaders = (token?: string, isGuest = false, guestId?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (isGuest && guestId) {
    headers['X-Guest-Id'] = guestId;
  }
  return headers;
};

export const apiClient = {
  post: async <T = unknown>(
    endpoint: string,
    data: unknown,
    token?: string,
    guestId?: string
  ): Promise<ApiResponse<T>> => {
    const isGuestRequest = endpoint.includes('/guest-booking') || guestId !== undefined;
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: buildHeaders(token, isGuestRequest, guestId),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: 'Network or server error' }));
      throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
    }

    return res.json();
  },

  get: async <T = unknown>(endpoint: string, token?: string, guestId?: string): Promise<ApiResponse<T>> => {
    const isGuestRequest = guestId !== undefined;
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: buildHeaders(token, isGuestRequest, guestId),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: 'Network or server error' }));
      throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
    }

    return res.json();
  },

  patch: async <T = unknown>(endpoint: string, formData: FormData, token?: string): Promise<ApiResponse<T>> => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`, // Token passed in
      },
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: 'Network or server error' }));
      throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
    }

    return res.json();
  },
};