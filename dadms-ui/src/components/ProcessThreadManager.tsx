import React, { useState } from 'react';
import { Button, Card, Icon } from './shared';
import { FormField, Input } from './shared/FormField';

// Mock data types
interface TaskFeedback {
    user: string;
    timestamp: string;
    comment: string;
}

interface ServiceTaskContext {
    task_id: string;
    name: string;
    input_context: any;
    injected_context: any;
    output_context: any;
    created_at: string;
    feedback?: TaskFeedback[];
}

interface ProcessThread {
    thread_id: string;
    process_name: string;
    process_version: number;
    status: 'active' | 'completed' | 'error' | 'pending';
    created_at: string;
    metadata: any;
    tasks: ServiceTaskContext[];
    feedback?: TaskFeedback[];
}

interface SimilarTask {
    thread_id: string;
    similarity_score: number;
    process_name: string;
    created_at: string;
    context_overlap: string[];
}

interface AnalysisThread {
    id: string;
    openai_thread: string;
    openai_assistant: string;
    name: string;
    status: 'active' | 'completed' | 'error' | 'pending';
    created_at: string;
    last_activity: string;
    analysis_count: number;
    analysis_ids: string[];
    process_definition?: {
        name: string;
        version: number;
        key: string;
    };
}

interface ProcessThreadManagerProps {
    threads?: AnalysisThread[];
}

// Mock data
const MOCK_THREADS: ProcessThread[] = [
    {
        thread_id: 'thread-001',
        process_name: 'Strategic Planning Process',
        process_version: 2,
        status: 'completed',
        created_at: '2024-01-15T10:30:00Z',
        metadata: { initiator: 'john.doe', priority: 'high' },
        tasks: [
            {
                task_id: 'task-001',
                name: 'Requirements Analysis',
                input_context: { requirements: ['scalability', 'security'] },
                injected_context: { best_practices: true },
                output_context: { analysis_complete: true },
                created_at: '2024-01-15T10:30:00Z',
                feedback: [
                    {
                        user: 'jane.smith',
                        timestamp: '2024-01-15T12:00:00Z',
                        comment: 'Analysis was thorough and well-documented.'
                    }
                ]
            }
        ],
        feedback: [
            {
                user: 'manager.jones',
                timestamp: '2024-01-15T16:00:00Z',
                comment: 'Process completed successfully with good stakeholder engagement.'
            }
        ]
    }
];

const MOCK_SIMILAR_TASKS: SimilarTask[] = [
    {
        thread_id: 'thread-002',
        similarity_score: 0.85,
        process_name: 'Risk Assessment Process',
        created_at: '2024-01-10T09:00:00Z',
        context_overlap: ['security', 'compliance']
    }
];

const ProcessThreadManager: React.FC<ProcessThreadManagerProps> = ({ threads = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedThread, setSelectedThread] = useState<ProcessThread | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackComment, setFeedbackComment] = useState('');

    const filteredThreads = MOCK_THREADS.filter(thread =>
        thread.process_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thread.thread_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-theme-accent-success bg-theme-accent-success bg-opacity-20';
            case 'completed': return 'text-theme-accent-info bg-theme-accent-info bg-opacity-20';
            case 'error': return 'text-theme-accent-error bg-theme-accent-error bg-opacity-20';
            case 'pending': return 'text-theme-accent-warning bg-theme-accent-warning bg-opacity-20';
            default: return 'text-theme-text-secondary bg-theme-surface-hover';
        }
    };

    const formatDateTime = (dateTime: string) => {
        return new Date(dateTime).toLocaleString();
    };

    const handleAddFeedback = () => {
        if (feedbackComment.trim() && selectedThread) {
            // In a real implementation, this would call an API
            console.log('Adding feedback:', feedbackComment);
            setFeedbackComment('');
            setShowFeedback(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-semibold text-theme-text-primary mb-2">Process Thread Manager</h2>
                <p className="text-theme-text-secondary">
                    Track and manage process execution threads with comprehensive feedback collection.
                </p>
            </div>

            <div className="flex gap-6 h-[70vh] max-w-full overflow-hidden">
                {/* Thread List */}
                <div className="w-96 min-w-96 max-w-96 flex-shrink-0">
                    <Card variant="outlined" padding="md" className="h-full">
                        <div className="mb-4">
                            <FormField label="Search Threads">
                                <div className="relative">
                                    <Input
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search by name or ID..."
                                        className="pl-10"
                                    />
                                    <Icon name="search" size="md" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-text-muted" />
                                </div>
                            </FormField>
                        </div>

                        <div className="space-y-2 overflow-y-auto max-h-[calc(100%-80px)]">
                            {filteredThreads.length === 0 ? (
                                <div className="flex justify-center py-8">
                                    <div className="text-center text-theme-text-secondary">
                                        <Icon name="search" size="lg" className="mx-auto mb-2 text-theme-text-muted" />
                                        <p>No threads found</p>
                                    </div>
                                </div>
                            ) : (
                                filteredThreads.map((thread) => (
                                    <button
                                        key={thread.thread_id}
                                        onClick={() => setSelectedThread(thread)}
                                        className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${selectedThread?.thread_id === thread.thread_id
                                                ? 'bg-theme-accent-primary bg-opacity-20 border-theme-accent-primary'
                                                : 'bg-theme-surface-elevated border-theme-border hover:bg-theme-surface-hover'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 max-w-full overflow-hidden">
                                            <Icon name="type-hierarchy" size="md" className="flex-shrink-0 text-theme-accent-primary" />
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium text-theme-text-primary truncate">
                                                    {thread.process_name}
                                                </div>
                                                <div className="text-xs text-theme-text-secondary">
                                                    v{thread.process_version} • {thread.thread_id.substring(0, 8)}...
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-2">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(thread.status)}`}>
                                                {thread.status}
                                            </span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </Card>
                </div>

                {/* Thread Details */}
                <div className="flex-1 min-w-0 overflow-hidden max-w-[calc(100vw-450px)] w-full">
                    {selectedThread ? (
                        <Card variant="outlined" padding="none" className="h-full">
                            {/* Thread Header */}
                            <div className="p-4 border-b border-theme-border bg-theme-surface-elevated">
                                <div className="flex items-center justify-between max-w-full overflow-hidden">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-lg font-semibold text-theme-text-primary truncate">
                                            {selectedThread.process_name}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-theme-text-secondary mt-1">
                                            <span>Thread: {selectedThread.thread_id}</span>
                                            <span>Version: {selectedThread.process_version}</span>
                                            <span>Created: {formatDateTime(selectedThread.created_at)}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            leftIcon="comment"
                                            onClick={() => setShowFeedback(!showFeedback)}
                                        >
                                            Add Feedback
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Feedback Form */}
                            {showFeedback && (
                                <div className="p-4 border-b border-theme-border bg-theme-surface-hover">
                                    <FormField label="Add Feedback">
                                        <div className="space-y-3">
                                            <Input
                                                value={feedbackComment}
                                                onChange={(e) => setFeedbackComment(e.target.value)}
                                                placeholder="Share your feedback about this thread..."
                                                className="w-full"
                                            />
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="tertiary" onClick={() => setShowFeedback(false)}>
                                                    Cancel
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="primary"
                                                    onClick={handleAddFeedback}
                                                    disabled={!feedbackComment.trim()}
                                                >
                                                    Submit
                                                </Button>
                                            </div>
                                        </div>
                                    </FormField>
                                </div>
                            )}

                            {/* Tasks */}
                            <div className="p-4 border-b border-theme-border bg-theme-surface-elevated">
                                <h4 className="text-md font-medium text-theme-text-primary mb-3">
                                    Tasks ({selectedThread.tasks.length})
                                </h4>
                                <div className="space-y-3">
                                    {selectedThread.tasks.map((task) => (
                                        <div key={task.task_id} className="bg-theme-surface rounded-lg p-3 border border-theme-border">
                                            <div className="flex items-center justify-between mb-2">
                                                <h5 className="font-medium text-theme-text-primary">{task.name}</h5>
                                                <span className="text-xs text-theme-text-secondary">{task.task_id}</span>
                                            </div>
                                            <div className="text-sm text-theme-text-secondary">
                                                Created: {formatDateTime(task.created_at)}
                                            </div>
                                            {task.feedback && task.feedback.length > 0 && (
                                                <div className="mt-2 text-sm">
                                                    <span className="text-theme-accent-success">
                                                        {task.feedback.length} feedback item(s)
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Similar Tasks */}
                            <div className="p-4 border-b border-theme-border bg-theme-surface-elevated">
                                <div className="flex flex-col gap-2">
                                    <h4 className="text-md font-medium text-theme-text-primary">Similar Tasks</h4>
                                    <div className="space-y-2">
                                        {MOCK_SIMILAR_TASKS.map((similar, index) => (
                                            <div key={index} className="bg-theme-surface rounded-lg p-3 border border-theme-border">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-theme-text-primary">{similar.process_name}</span>
                                                    <span className="text-sm text-theme-accent-success">
                                                        {Math.round(similar.similarity_score * 100)}% similar
                                                    </span>
                                                </div>
                                                <div className="text-xs text-theme-text-secondary mt-1">
                                                    Overlap: {similar.context_overlap.join(', ')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Thread Feedback */}
                            <div className="p-4 overflow-y-auto max-h-64">
                                <h4 className="text-md font-medium text-theme-text-primary mb-3">Thread Feedback</h4>
                                {selectedThread.feedback && selectedThread.feedback.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedThread.feedback.map((feedback, index) => (
                                            <div key={index} className="bg-theme-surface-elevated rounded-lg p-3 border border-theme-border">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium text-theme-text-primary">{feedback.user}</span>
                                                    <span className="text-xs text-theme-text-secondary">
                                                        {formatDateTime(feedback.timestamp)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-theme-text-secondary">{feedback.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-theme-text-secondary">
                                        <Icon name="comment" size="lg" className="mx-auto mb-2 text-theme-text-muted" />
                                        <p>No feedback yet</p>
                                        <p className="text-xs">Add feedback to help improve future processes</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ) : (
                        <Card variant="outlined" padding="md" className="h-full">
                            <div className="flex items-center justify-center h-full text-theme-text-secondary">
                                <div className="text-center">
                                    <Icon name="type-hierarchy" size="xl" className="mx-auto mb-4 text-theme-text-muted" />
                                    <p className="text-lg">Select a thread to view details</p>
                                    <p className="text-sm">Choose from the list to see tasks, feedback, and analysis</p>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProcessThreadManager; 