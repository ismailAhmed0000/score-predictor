import { API_URL, TOKEN_KEY, USER_KEY } from './config';
import { ApiError, parseErrorMessage } from './errors';
import type { User } from './types';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function setUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  auth?: boolean;
};

export function buildApiUrl(path: string): string {
  if (!/^https?:\/\//i.test(API_URL)) {
    throw new ApiError(
      'API URL is misconfigured. Set VITE_API_URL to your backend, e.g. https://your-app.up.railway.app',
      0,
    );
  }

  return new URL(path, `${API_URL.replace(/\/$/, '')}/`).href;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, auth = true, headers, ...init } = options;

  const token = getToken();
  const res = await fetch(buildApiUrl(path), {
    ...init,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw new ApiError(await parseErrorMessage(res), res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text) {
    return null as T;
  }

  return JSON.parse(text) as T;
}
