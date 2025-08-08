export interface CamundaVariable {
    value: unknown;
    type?: string;
}

export interface CamundaVariables {
    [key: string]: CamundaVariable;
}

export interface FetchTopic {
    topicName: string;
    lockDuration: number; // ms
    variables?: string[];
}

export interface FetchAndLockRequest {
    workerId: string;
    maxTasks: number;
    usePriority?: boolean;
    asyncResponseTimeout?: number; // ms (long-poll)
    topics: FetchTopic[];
}

export interface ExternalTask {
    id: string;
    topicName: string;
    activityId?: string;
    processInstanceId?: string;
    processDefinitionId?: string;
    retries?: number | null;
    variables?: Record<string, { value: unknown; type?: string }>;
}

export interface FetchAndLockResponse extends Array<ExternalTask> { }

export interface CompleteRequest {
    workerId: string;
    variables?: CamundaVariables;
}

export interface FailureRequest {
    workerId: string;
    errorMessage: string;
    errorDetails?: string;
    retries: number;
    retryTimeout: number; // ms
}


