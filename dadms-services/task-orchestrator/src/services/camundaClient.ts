import { CompleteRequest, FailureRequest, FetchAndLockRequest, FetchAndLockResponse } from '../types/camunda';

export class CamundaClient {
    constructor(
        private readonly baseUrl: string,
        private readonly workerId: string,
    ) { }

    async fetchAndLock(payload: FetchAndLockRequest): Promise<FetchAndLockResponse> {
        const res = await fetch(`${this.baseUrl}/external-task/fetchAndLock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`fetchAndLock failed: ${res.status}`);
        return (await res.json()) as FetchAndLockResponse;
    }

    async complete(taskId: string, payload: CompleteRequest): Promise<void> {
        const res = await fetch(`${this.baseUrl}/external-task/${taskId}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`complete failed: ${res.status}`);
    }

    async failure(taskId: string, payload: FailureRequest): Promise<void> {
        const res = await fetch(`${this.baseUrl}/external-task/${taskId}/failure`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`failure failed: ${res.status}`);
    }
}
