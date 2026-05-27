import { mockApi } from './mock';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export interface ApiResult<T> {
  data: T;
  status: number;
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  if (!API_BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_URL is not configured.');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return {
    data: await response.json() as T,
    status: response.status,
  };
}

export const teraApi = mockApi;
