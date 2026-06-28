function normalizeApiUrl(raw: string): string {
  const url = raw.trim().replace(/\/$/, '');
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('localhost') || url.startsWith('127.0.0.1')) {
    return `http://${url}`;
  }
  return `https://${url}`;
}

export const API_URL = normalizeApiUrl(
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
);
export const TOKEN_KEY = 'token';
export const USER_KEY = 'user';
