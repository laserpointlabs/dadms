import { FetchAndLockRequest } from '../types/camunda';
import { CamundaClient } from './camundaClient';

export type TopicHandler = (task: any) => Promise<void>;

export interface WorkerOptions {
    camundaUrl: string;
    workerId: string;
    lockDurationMs?: number;
    longPollMs?: number;
    maxTasks?: number;
    topics: string[];
}

export class ExternalTaskWorker {
    private stopped = false;
    private readonly client: CamundaClient;
    private readonly opts: Required<WorkerOptions>;
    private readonly handlers: Map<string, TopicHandler> = new Map();

    constructor(options: WorkerOptions) {
        this.opts = {
            lockDurationMs: 60000,
            longPollMs: 30000,
            maxTasks: 5,
            ...options,
        } as Required<WorkerOptions>;
        this.client = new CamundaClient(this.opts.camundaUrl, this.opts.workerId);
    }

    on(topic: string, handler: TopicHandler) {
        this.handlers.set(topic, handler);
    }

    async start(): Promise<void> {
        while (!this.stopped) {
            try {
                const payload: FetchAndLockRequest = {
                    workerId: this.opts.workerId,
                    maxTasks: this.opts.maxTasks,
                    asyncResponseTimeout: this.opts.longPollMs,
                    usePriority: true,
                    topics: this.opts.topics.map((t) => ({ topicName: t, lockDuration: this.opts.lockDurationMs })),
                };
                const tasks = await this.client.fetchAndLock(payload);
                for (const task of tasks) {
                    const handler = this.handlers.get(task.topicName);
                    if (!handler) {
                        // unlock via failure with 0 retries + short timeout
                        await this.safeFail(task.id, 'No handler for topic', 0, 1000);
                        continue;
                    }
                    await this.processTask(task, handler);
                }
            } catch (e) {
                // brief backoff on error
                await this.sleep(1000);
            }
        }
    }

    stop() {
        this.stopped = true;
    }

    private async processTask(task: any, handler: TopicHandler) {
        const started = Date.now();
        try {
            console.log(`[worker] processing task ${task.id} topic=${task.topicName}`);
            await handler(task);
            await this.client.complete(task.id, { workerId: this.opts.workerId });
            console.log(`[worker] completed task ${task.id} in ${Date.now() - started}ms`);
        } catch (err: any) {
            console.warn(`[worker] task ${task.id} failed: ${err?.message || err}`);
            const retries = typeof task.retries === 'number' ? task.retries : 3;
            const nextRetries = Math.max(retries - 1, 0);
            const retryTimeout = Math.min(30000, 2000 * (4 - nextRetries));
            await this.safeFail(task.id, err?.message || 'task failed', nextRetries, retryTimeout);
        }
    }

    private async safeFail(taskId: string, message: string, retries: number, timeoutMs: number) {
        try {
            await this.client.failure(taskId, {
                workerId: this.opts.workerId,
                errorMessage: message,
                retries,
                retryTimeout: timeoutMs,
            });
        } catch (e) {
            console.error(`[worker] failure report failed for ${taskId}:`, e);
        }
    }

    private sleep(ms: number) {
        return new Promise((r) => setTimeout(r, ms));
    }
}


