import axios, { AxiosInstance, AxiosError } from 'axios';
import type { RestClientConfig } from './types/index.js';
import { configureApiKeyAuth, validateApiKey } from './auth/api-key.js';
import { TaskResource } from './resources/task.js';
import { QueueResource } from './resources/queue.js';
import { ReviewResource } from './resources/review.js';
import {
  DatashiftError,
  AuthenticationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError,
} from './errors.js';

const DEFAULT_BASE_URL = 'https://api.datashift.io';
const DEFAULT_TIMEOUT = 30000;
const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000;

/**
 * Datashift REST API client
 *
 * Use this client for backend service integrations with API key authentication.
 * For AI agents with real-time push notifications, use DatashiftMcpClient instead.
 *
 * @example
 * ```typescript
 * const datashift = new DatashiftRestClient({
 *   apiKey: 'sk_...',
 * });
 *
 * const task = await datashift.task.submit({
 *   queueKey: 'approvals',
 *   data: { action: 'delete-account' },
 * });
 *
 * const result = await datashift.task.waitForReview(task.id);
 * ```
 */
export class DatashiftRestClient {
  private client: AxiosInstance;
  private retries: number;
  private retryDelay: number;

  public readonly task: TaskResource;
  public readonly queue: QueueResource;
  public readonly review: ReviewResource;

  constructor(config: RestClientConfig) {
    validateApiKey(config.apiKey);

    this.retries = config.retries ?? DEFAULT_RETRIES;
    this.retryDelay = config.retryDelay ?? DEFAULT_RETRY_DELAY;

    this.client = axios.create({
      baseURL: config.baseUrl ?? DEFAULT_BASE_URL,
      timeout: config.timeout ?? DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Configure API key authentication
    configureApiKeyAuth(this.client, config.apiKey);

    // Configure error handling
    this.setupErrorInterceptor();

    // Initialize resources
    this.task = new TaskResource(this.client);
    this.queue = new QueueResource(this.client);
    this.review = new ReviewResource(this.client);
  }

  private setupErrorInterceptor(): void {
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // Handle retry logic for transient errors
        const config = error.config;
        if (config && this.shouldRetry(error)) {
          const retryCount = (config as any).__retryCount || 0;
          if (retryCount < this.retries) {
            (config as any).__retryCount = retryCount + 1;
            await this.sleep(this.retryDelay * Math.pow(2, retryCount));
            return this.client.request(config);
          }
        }

        // Transform to SDK errors
        throw this.transformError(error);
      },
    );
  }

  private shouldRetry(error: AxiosError): boolean {
    // Retry on network errors or 5xx server errors
    if (!error.response) return true;
    return error.response.status >= 500 && error.response.status < 600;
  }

  private transformError(error: AxiosError): DatashiftError {
    if (!error.response) {
      return new DatashiftError(
        'Network error: Unable to reach Datashift API',
        undefined,
        'NETWORK_ERROR',
      );
    }

    const status = error.response.status;
    const data = error.response.data as any;
    const message = data?.message || error.message;

    switch (status) {
      case 401:
        return new AuthenticationError(message);
      case 404:
        return new NotFoundError('Resource', data?.entityId);
      case 400:
        return new ValidationError(message, data?.errors);
      case 429:
        return new RateLimitError(data?.retryAfter);
      case 500:
      case 502:
      case 503:
      case 504:
        return new ServerError(message);
      default:
        return new DatashiftError(message, status, data?.code, data);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
