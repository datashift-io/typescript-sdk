# @datashift/sdk

TypeScript SDK for integrating human-in-the-loop checkpoints into AI agent workflows.

## Overview

Datashift enables AI agents to submit tasks for further review. Reviewers can be
humans, AI, or a combination of both.

## Installation

```bash
npm install @datashift/sdk
```

## Quick Start

```typescript
import {DatashiftRestClient} from '@datashift/sdk';

const datashift = new DatashiftRestClient({
    apiKey: process.env.DATASHIFT_API_KEY!,
});

// Submit a task
const task = await datashift.task.submit({
    queueKey: 'content-moderation',
    data: {contentId: 'post_456', text: 'User generated content...'},
    summary: 'Review flagged content',
});

// Poll for completion
const completed = await datashift.task.waitForReview(task.id, {
    timeout: 300000,    // 5 minutes
    pollInterval: 5000, // Check every 5 seconds
});

// Or use webhooks for async notification (see Webhooks section)
```

## Authentication

Create an API key in the Datashift Console.

```typescript
const datashift = new DatashiftRestClient({
    apiKey: 'sk_live_...', // Production key
    // apiKey: 'sk_test_...', // Test key
});
```

## REST Client API

### Task Operations

```typescript
// Submit a task
const task = await datashift.task.submit({
    queueKey: 'approvals',
    data: {...},
    summary: 'Short description',
});

// Get task by ID
const task = await datashift.task.get(taskId);

// Get task status (lightweight)
const status = await datashift.task.getStatus(taskId);

// List tasks
const tasks = await datashift.task.list({
    queueId?: string;
    state?: 'pending' | 'queued' | 'completed';
});

// Wait for review
const completed = await datashift.task.waitForReview(taskId, {
    timeout: 300000,       // 5 minutes
    pollInterval: 2000,    // Start at 2s
    maxPollInterval: 30000 // Back off to 30s
});
```

### Queue Operations

```typescript
// List queues
const queues = await datashift.queue.list();

// Get queue config
const queue = await datashift.queue.get('refund-approvals');
```

### Review Operations

```typescript
// List reviews with filters
const reviews = await datashift.review.list({
    queueKey: 'approvals',
    reviewerType: 'human',
    from: new Date('2024-01-01'),
    limit: 50,
});

// Get review by ID
const review = await datashift.review.get(reviewId);
```

### Webhook Operations

```typescript
// Create webhook
const webhook = await datashift.webhook.create({
    url: 'https://your-service.com/webhook',
    events: ['task.completed'],
});
// Save webhook.secret securely!

// List webhooks
const webhooks = await datashift.webhook.list();

// Update webhook
const updated = await datashift.webhook.update(webhookId, {
    url: 'https://new-url.com/webhook',
    events: ['task.completed', 'task.created'],
    active: true,
});

// Rotate webhook secret
const rotated = await datashift.webhook.rotateSecret(webhookId);
// Save rotated.secret securely!

// Send test event
await datashift.webhook.test(webhookId);

// Delete webhook
await datashift.webhook.delete(webhookId);
```

## Webhooks

Webhooks provide async notifications when tasks are completed.

### Setting Up a Webhook Endpoint

```typescript
import express from 'express';
import {verifyWebhookSignature, parseWebhookEvent} from '@datashift/sdk';
import type {WebhookEvent} from '@datashift/sdk';

const app = express();

// IMPORTANT: Use raw body for signature verification
app.post('/webhook/datashift',
    express.raw({type: 'application/json'}),
    (req, res) => {
        const signature = req.headers['x-datashift-signature'] as string;

        // Verify signature
        if (!verifyWebhookSignature(req.body, signature, WEBHOOK_SECRET)) {
            return res.status(401).send('Invalid signature');
        }

        // Parse event
        const event = parseWebhookEvent<WebhookEvent>(req.body);

        if (event.event === 'task.completed') {
            const {task_id, result, review} = event.data;
            handleTaskCompleted(task_id, result, review);
        }

        res.status(200).send('OK');
    }
);
```

### Webhook Events

| Event            | Description                    |
|------------------|--------------------------------|
| `task.completed` | Task review has been completed |

### Webhook Payload

```typescript
interface WebhookEvent {
    event: string;      // Event type
    timestamp: string;  // ISO 8601 timestamp
    data: {
        task_id: string;
        queue_key: string;
        state: string;
        result: string[];
        review?: Review;
    };
}
```

## Types

### Task

```typescript
interface Task {
    id: string;
    queue_id: string;
    external_id: string | null;
    state: 'pending' | 'queued' | 'completed';
    data: Record<string, unknown>;
    context: Record<string, unknown>;
    metadata: Record<string, unknown>;
    summary: string | null;
    sla_deadline: string | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
    reviews?: Review[];
}
```

### Queue

```typescript
interface Queue {
    id: string;
    key: string;
    name: string;
    description: string | null;
    review_type: 'approval' | 'labeling' | 'classification' | 'scoring' | 'augmentation';
    review_options: ReviewOption[];
    assignment: 'manual' | 'round_robin' | 'ai_first';
    sla_minutes: number | null;
    deleted_at: string | null;
}
```

### Review

```typescript
interface Review {
    id: string;
    task_id: string;
    reviewer_id: string | null;
    result: string[];
    data: Record<string, unknown>;
    comment: string | null;
    created_at: string;
}
```

### ListReviewsFilters

```typescript
interface ListReviewsFilters {
    taskId?: string;
    reviewerId?: string;
    queueKey?: string;
    reviewerType?: 'ai' | 'human';
    from?: Date | string;
    to?: Date | string;
    limit?: number;
    offset?: number;
}
```

### ReviewResult

```typescript
interface ReviewResult {
    task_id: string;
    result: string[];
    data: Record<string, unknown>;
    completed_at: string;
    review: Review;
}
```

## Error Handling

The SDK provides typed error classes for common error scenarios.

```typescript
import {
    DatashiftError,
    AuthenticationError,
    NotFoundError,
    ValidationError,
    TimeoutError,
    RateLimitError,
    ServerError,
} from '@datashift/sdk';

try {
    const result = await datashift.task.waitForReview(taskId, {timeout: 60000});
} catch (error) {
    if (error instanceof TimeoutError) {
        console.log('Review not completed in time');
    } else if (error instanceof AuthenticationError) {
        console.log('Invalid credentials');
    } else if (error instanceof NotFoundError) {
        console.log('Task not found');
    } else if (error instanceof RateLimitError) {
        console.log(`Rate limited. Retry after ${error.retryAfter}s`);
    } else if (error instanceof DatashiftError) {
        console.log(`API error: ${error.message}`);
    }
}
```

## Configuration

### REST Client Options

```typescript
interface RestClientConfig {
    apiKey: string;       // Required
    baseUrl?: string;     // Default: 'https://api.datashift.io'
    timeout?: number;     // Request timeout (default: 30000ms)
    retries?: number;     // Retry count (default: 3)
    retryDelay?: number;  // Initial retry delay (default: 1000ms)
}
```

### Wait Options

```typescript
interface WaitOptions {
    timeout?: number;        // Max wait time (default: 300000ms)
    pollInterval?: number;   // Poll interval (default: 2000ms)
    maxPollInterval?: number; // Max poll interval for backoff (default: 30000ms)
}
```

## Examples

### Backend Service with Webhooks

```typescript
import {DatashiftRestClient, verifyWebhookSignature, parseWebhookEvent} from '@datashift/sdk';
import type {WebhookEvent} from '@datashift/sdk';
import express from 'express';

const datashift = new DatashiftRestClient({
    apiKey: process.env.DATASHIFT_API_KEY!,
});

// Store pending tasks (use Redis/DB in production)
const pendingTasks = new Map<string, (result: any) => void>();

// Submit task and return immediately
async function submitForReview(data: any): Promise<string> {
    const task = await datashift.task.submit({
        queueKey: 'reviews',
        data,
    });
    return task.id;
}

// Webhook handler
const app = express();

app.post('/webhook/datashift',
    express.raw({type: 'application/json'}),
    (req, res) => {
        const signature = req.headers['x-datashift-signature'] as string;

        if (!verifyWebhookSignature(req.body, signature, process.env.WEBHOOK_SECRET!)) {
            return res.status(401).send('Invalid signature');
        }

        const event = parseWebhookEvent<WebhookEvent>(req.body);

        if (event.event === 'task.completed') {
            const resolver = pendingTasks.get(event.data.task_id);
            if (resolver) {
                resolver(event.data);
                pendingTasks.delete(event.data.task_id);
            }
        }

        res.status(200).send('OK');
    }
);

app.listen(3000);
```

## Requirements

- Node.js 18+
- TypeScript 5.0+ (for type definitions)

## License

MIT
