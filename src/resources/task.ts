import type { AxiosInstance } from 'axios';
import type {
  Task,
  TaskStatus,
  SubmitTaskInput,
  WaitOptions,
} from '../types/index.js';
import { TimeoutError } from '../errors.js';

const DEFAULT_WAIT_OPTIONS: Required<WaitOptions> = {
  timeout: 300000, // 5 minutes
  pollInterval: 2000, // 2 seconds
  maxPollInterval: 30000, // 30 seconds
};

export class TaskResource {
  constructor(private client: AxiosInstance) {}

  /**
   * Submit a task for human review
   */
  async submit(input: SubmitTaskInput): Promise<Task> {
    const response = await this.client.post<Task>('/task', {
      queue_key: input.queueKey,
      data: input.data,
      context: input.context ?? {},
      metadata: input.metadata ?? {},
      summary: input.summary,
      external_id: input.externalId,
    });
    return response.data;
  }

  /**
   * Get a task by ID with full details
   */
  async get(taskId: string): Promise<Task> {
    const response = await this.client.get<Task>(`/task/${taskId}`);
    return response.data;
  }

  /**
   * Get task status
   */
  private async getStatus(taskId: string): Promise<TaskStatus> {
    const response = await this.client.get<TaskStatus>(`/task/${taskId}/status`);
    return response.data;
  }

  /**
   * List tasks with optional filters
   */
  async list(filters?: { queueId?: string; state?: string }): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filters?.queueId) params.append('queue_id', filters.queueId);
    if (filters?.state) params.append('state', filters.state);

    const query = params.toString();
    const response = await this.client.get<Task[]>(`/task${query ? `?${query}` : ''}`);
    return response.data;
  }

  /**
   * Wait for a task to be reviewed
   */
  async waitForReview(taskId: string, options?: WaitOptions): Promise<Task> {
    const opts = { ...DEFAULT_WAIT_OPTIONS, ...options };
    const startTime = Date.now();
    let currentInterval = opts.pollInterval;

    while (Date.now() - startTime < opts.timeout) {
      const status = await this.getStatus(taskId);

      if (status.state === 'reviewed') {
        // Fetch full task with reviews
        return this.get(taskId);
      }

      // Wait before next poll
      await this.sleep(currentInterval);

      // Exponential backoff (double interval, cap at max)
      currentInterval = Math.min(currentInterval * 1.5, opts.maxPollInterval);
    }

    throw new TimeoutError(
      `Task ${taskId} was not reviewed within ${opts.timeout}ms`,
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
