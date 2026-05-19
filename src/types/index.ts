// Task types
export type TaskState = 'pending' | 'queued' | 'reviewed';

export interface TaskChoice {
  key: string;
  label: string;
  description?: string | null;
  // Structured per-choice fields (e.g., address/EIN for an entity-match candidate).
  data?: Record<string, unknown> | null;
}

export interface Task {
  id: string;
  organization_id: string;
  queue_id: string;
  external_id: string | null;
  state: TaskState;
  data: Record<string, unknown>;
  context: Record<string, unknown>;
  metadata: Record<string, unknown>;
  choices: TaskChoice[] | null;
  max_selections: number | null;
  summary: string | null;
  sla_deadline: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  queue?: Queue;
  reviews?: Review[];
}

export interface TaskStatus {
  state: TaskState;
  reviewed_at: string | null;
}

export interface SubmitTaskInput {
  queueKey: string;
  data: Record<string, unknown>;
  context?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  summary?: string;
  externalId?: string;
  // Required for queues with review_type='multiple_choice'; rejected on other types.
  choices?: TaskChoice[];
  // Per-task upper bound on selections; MC only. Overrides queue.max_selections.
  maxSelections?: number;
}

// Queue types
export type ReviewType =
  | 'approval'
  | 'labeling'
  | 'classification'
  | 'multiple_choice'
  | 'scoring'
  | 'augmentation';

export type FeedbackRequired = 'never' | 'always' | 'when_empty';

export type AssignmentStrategy = 'manual' | 'round_robin' | 'ai_first' | 'ai_last';

export interface ReviewOption {
  id: string;
  label: string;
  display_order: number;
}

export interface Queue {
  id: string;
  organization_id: string;
  key: string;
  name: string;
  description: string | null;
  review_type: ReviewType;
  review_options: ReviewOption[];
  max_selections: number | null;
  result_required: boolean;
  feedback_required: FeedbackRequired;
  assignment: AssignmentStrategy;
  sla_minutes: number | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

// Review types
export interface Review {
  id: string;
  task_id: string;
  queue_id: string | null;
  reviewer_id: string | null;
  result: string[];
  data: Record<string, unknown>;
  feedback: string | null;
  created_at: string;
}

export interface ListReviewsFilters {
  taskId?: string;
  reviewerId?: string;
  queueKey?: string;
  reviewerType?: 'ai' | 'human';
  from?: Date | string;
  to?: Date | string;
  limit?: number;
  offset?: number;
}

// Configuration types
export interface RestClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface WaitOptions {
  timeout?: number;
  pollInterval?: number;
  maxPollInterval?: number;
}

// Review result (returned by waitForReview)
export interface ReviewResult {
  task_id: string;
  result: string[];
  data: Record<string, unknown>;
  reviewed_at: string;
  review: Review;
}

// Webhook event types
export type WebhookEventType = 'task.created' | 'task.reviewed';

export interface WebhookTaskData {
  id: string;
  external_id: string | null;
  state: string;
  summary: string | null;
  data: Record<string, unknown>;
  metadata: Record<string, unknown>;
  // Per-task choices for multiple_choice queues; null otherwise.
  choices: TaskChoice[] | null;
  // Per-task max_selections override for multiple_choice queues; null otherwise.
  max_selections: number | null;
  sla_deadline: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface WebhookQueueData {
  key: string;
  name: string;
  review_type: string;
}

export interface WebhookReviewData {
  result: string[];
  data: Record<string, unknown>;
  feedback: string | null;
  reviewer: { name: string; type: string };
  created_at: string;
}

export interface TaskCreatedWebhookEvent {
  event: 'task.created';
  timestamp: string;
  data: {
    task: WebhookTaskData;
    queue: WebhookQueueData;
  };
}

export interface TaskReviewedWebhookEvent {
  event: 'task.reviewed';
  timestamp: string;
  data: {
    task: WebhookTaskData;
    queue: WebhookQueueData;
    reviews: WebhookReviewData[];
  };
}

export type WebhookEvent = TaskCreatedWebhookEvent | TaskReviewedWebhookEvent;
