import type { AxiosInstance } from 'axios';
import type { Queue } from '../types/index.js';

export class QueueResource {
  constructor(private client: AxiosInstance) {}

  /**
   * List all queues available to the organization
   */
  async list(): Promise<Queue[]> {
    const response = await this.client.get<Queue[]>('/queue');
    return response.data;
  }

  /**
   * Get a queue by key
   */
  async get(key: string): Promise<Queue> {
    const response = await this.client.get<Queue>(`/queue/${key}`);
    return response.data;
  }
}
