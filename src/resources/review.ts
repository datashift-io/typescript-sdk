import type { AxiosInstance } from 'axios';
import type { Review, ListReviewsFilters } from '../types/index.js';

export class ReviewResource {
  constructor(private client: AxiosInstance) {}

  /**
   * List reviews with optional filters
   */
  async list(filters?: ListReviewsFilters): Promise<Review[]> {
    const params = new URLSearchParams();

    if (filters?.taskId) params.append('task_id', filters.taskId);
    if (filters?.reviewerId) params.append('reviewer_id', filters.reviewerId);
    if (filters?.queueKey) params.append('queue_key', filters.queueKey);
    if (filters?.reviewerType) params.append('reviewer_type', filters.reviewerType);
    if (filters?.from) {
      const date = filters.from instanceof Date
        ? filters.from.toISOString()
        : filters.from;
      params.append('created_after', date);
    }
    if (filters?.to) {
      const date = filters.to instanceof Date
        ? filters.to.toISOString()
        : filters.to;
      params.append('created_before', date);
    }
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const query = params.toString();
    const response = await this.client.get<Review[]>(`/review${query ? `?${query}` : ''}`);
    return response.data;
  }

  /**
   * Get a review by ID
   */
  async get(reviewId: string): Promise<Review> {
    const response = await this.client.get<Review>(`/review/${reviewId}`);
    return response.data;
  }
}
