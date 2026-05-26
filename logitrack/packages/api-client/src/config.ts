const env = (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env;

export const API_BASE_URL = env?.VITE_API_BASE_URL ?? 'http://localhost:8080';
