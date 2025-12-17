import type { AxiosInstance } from 'axios';

/**
 * Configures axios instance with API key authentication
 */
export function configureApiKeyAuth(client: AxiosInstance, apiKey: string): void {
  client.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${apiKey}`;
    return config;
  });
}

/**
 * Validates API key format
 */
export function validateApiKey(apiKey: string): void {
  if (!apiKey) {
    throw new Error('API key is required');
  }

  if (!apiKey.startsWith('sk_live_') && !apiKey.startsWith('sk_test_')) {
    throw new Error('Invalid API key format. Expected sk_live_* or sk_test_*');
  }
}

