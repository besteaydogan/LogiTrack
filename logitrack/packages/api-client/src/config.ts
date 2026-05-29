const env = (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env;

export const API_BASE_URL = env?.VITE_API_BASE_URL ?? 'http://localhost:8080';

export function websocketUrl(path: string) {
  const baseUrl = new URL(API_BASE_URL);
  baseUrl.protocol = baseUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  baseUrl.pathname = path;
  baseUrl.search = '';
  baseUrl.hash = '';
  return baseUrl.toString();
}
