import React, { useState } from 'react';
import { Alert, Button, Card, Icon } from './shared';
import { FormField, TextArea } from './shared/FormField';

// Mock impacted tasks for the impact analysis report
const MOCK_IMPACTED_TASKS = [
    {
        thread_id: 'thread-2',
        process_name: 'Purchase Request',
        process_version: 1,
        task_id: 'task-3',
        task_name: 'Review Request',
        impact_score: 0.92,
        explanation: 'This task is highly similar to a changed node in the new process definition.'
    },
    {
        thread_id: 'thread-4',
        process_name: 'Vendor Onboarding',
        process_version: 2,
        task_id: 'task-9',
        task_name: 'Approve Vendor',
        impact_score: 0.78,
        explanation: 'This task shares key decision criteria with the updated process.'
    },
    {
        thread_id: 'thread-6',
        process_name: 'Contract Review',
        process_version: 1,
        task_id: 'task-12',
        task_name: 'Legal Assessment',
        impact_score: 0.65,
        explanation: 'This task may be affected by changes to approval workflow patterns.'
    }
];

// Mock LLM summary of risks/concerns
const MOCK_LLM_SUMMARY = [
    'Potential compatibility issues with legacy systems or existing workflows.',
    'High similarity to critical decision points in previous processes; changes may introduce unintended side effects.',
    'Recommend careful testing and stakeholder review before deployment.',
    'Consider gradual rollout to minimize disruption to ongoing processes.'
];

// Mock analysis metrics
const MOCK_ANALYSIS_METRICS = {
    total_threads_analyzed: 127,
    high_impact_tasks: 3,
    medium_impact_tasks: 8,
    low_impact_tasks: 15,
    average_similarity_score: 0.73,
    risk_level: 'medium'
};

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

interface ThreadImpactAnalysisProps {
    threads?: AnalysisThread[];
}

const ThreadImpactAnalysis: React.FC<ThreadImpactAnalysisProps> = ({ threads = [] }) => {
    const [analysisQuery, setAnalysisQuery] = useState('');
    const [selectedImpact, setSelectedImpact] = useState<any>(null);
    const [showDetails, setShowDetails] = useState(false);

    const getImpactColor = (score: number) => {
        if (score >= 0.8) return 'text-theme-accent-error bg-theme-accent-error bg-opacity-20';
        if (score >= 0.6) return 'text-theme-accent-warning bg-theme-accent-warning bg-opacity-20';
        return 'text-theme-accent-success bg-theme-accent-success bg-opacity-20';
    };

    const getImpactLevel = (score: number) => {
        if (score >= 0.8) return 'High';
        if (score >= 0.6) return 'Medium';
        return 'Low';
    };

    const getRiskLevelColor = (level: string) => {
        switch (level) {
            case 'high': return 'text-theme-accent-error bg-theme-accent-error bg-opacity-20';
            case 'medium': return 'text-theme-accent-warning bg-theme-accent-warning bg-opacity-20';
            case 'low': return 'text-theme-accent-success bg-theme-accent-success bg-opacity-20';
            default: return 'text-theme-text-secondary bg-theme-surface-hover';
        }
    };

    const handleRunAnalysis = () => {
        if (analysisQuery.trim()) {
            // In a real implementation, this would trigger the analysis
            console.log('Running impact analysis for:', analysisQuery);
            setAnalysisQuery('');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-semibold text-theme-text-primary mb-2">Thread Impact Analysis</h2>
                <p className="text-theme-text-secondary">
                    Analyze the potential impact of process changes on existing threads and identify affected tasks.
                </p>
            </div>

            {/* Analysis Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card variant="outlined" padding="md">
                    <div className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-theme-accent-primary bg-opacity-20 rounded-lg mx-auto mb-3">
                            <Icon name="graph" size="lg" className="text-theme-accent-primary" />
                        </div>
                        <p className="text-sm text-theme-text-secondary mb-1">Threads Analyzed</p>
                        <p className="text-2xl font-bold text-theme-text-primary">{MOCK_ANALYSIS_METRICS.total_threads_analyzed}</p>
                    </div>
                </Card>

                <Card variant="outlined" padding="md">
                    <div className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-theme-accent-error bg-opacity-20 rounded-lg mx-auto mb-3">
                            <Icon name="warning" size="lg" className="text-theme-accent-error" />
                        </div>
                        <p className="text-sm text-theme-text-secondary mb-1">High Impact</p>
                        <p className="text-2xl font-bold text-theme-accent-error">{MOCK_ANALYSIS_METRICS.high_impact_tasks}</p>
                    </div>
                </Card>

                <Card variant="outlined" padding="md">
                    <div className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-theme-accent-warning bg-opacity-20 rounded-lg mx-auto mb-3">
                            <Icon name="info" size="lg" className="text-theme-accent-warning" />
                        </div>
                        <p className="text-sm text-theme-text-secondary mb-1">Medium Impact</p>
                        <p className="text-2xl font-bold text-theme-accent-warning">{MOCK_ANALYSIS_METRICS.medium_impact_tasks}</p>
                    </div>
                </Card>

                <Card variant="outlined" padding="md">
                    <div className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-theme-accent-success bg-opacity-20 rounded-lg mx-auto mb-3">
                            <Icon name="check" size="lg" className="text-theme-accent-success" />
                        </div>
                        <p className="text-sm text-theme-text-secondary mb-1">Low Impact</p>
                        <p className="text-2xl font-bold text-theme-accent-success">{MOCK_ANALYSIS_METRICS.low_impact_tasks}</p>
                    </div>
                </Card>
            </div>

            {/* Risk Assessment */}
            <Card variant="outlined" padding="md">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-theme-text-primary">Risk Assessment</h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelColor(MOCK_ANALYSIS_METRICS.risk_level)}`}>
                        {MOCK_ANALYSIS_METRICS.risk_level.toUpperCase()} RISK
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-medium text-theme-text-primary mb-3">Key Risks & Concerns</h4>
                        <div className="space-y-2">
                            {MOCK_LLM_SUMMARY.map((risk, index) => (
                                <div key={index} className="flex items-start gap-2 p-3 bg-theme-surface-elevated rounded-lg border border-theme-border">
                                    <Icon name="warning" size="sm" className="text-theme-accent-warning mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-theme-text-secondary">{risk}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium text-theme-text-primary mb-3">Analysis Metrics</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-theme-text-secondary">Average Similarity Score</span>
                                <span className="text-sm font-medium text-theme-text-primary">
                                    {Math.round(MOCK_ANALYSIS_METRICS.average_similarity_score * 100)}%
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-theme-text-secondary">Total Impacted Tasks</span>
                                <span className="text-sm font-medium text-theme-text-primary">
                                    {MOCK_ANALYSIS_METRICS.high_impact_tasks + MOCK_ANALYSIS_METRICS.medium_impact_tasks + MOCK_ANALYSIS_METRICS.low_impact_tasks}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-theme-text-secondary">Critical Threshold</span>
                                <span className="text-sm font-medium text-theme-accent-error">≥80% similarity</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Impact Analysis Query */}
            <Card variant="outlined" padding="md">
                <div className="flex items-center gap-2 mb-4">
                    <Icon name="search" size="md" className="text-theme-accent-primary" />
                    <h3 className="text-lg font-semibold text-theme-text-primary">Run Custom Analysis</h3>
                </div>

                <div className="space-y-4">
                    <FormField label="Analysis Query" helpText="Describe the process change you want to analyze">
                        <TextArea
                            rows={3}
                            value={analysisQuery}
                            onChange={(e) => setAnalysisQuery(e.target.value)}
                            placeholder="e.g., 'Analyze impact of changing approval workflow from 2-step to 3-step process'"
                        />
                    </FormField>

                    <div className="flex justify-end">
                        <Button
                            variant="primary"
                            leftIcon="graph"
                            onClick={handleRunAnalysis}
                            disabled={!analysisQuery.trim()}
                        >
                            Run Analysis
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Impacted Tasks */}
            <Card variant="outlined" padding="md">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-theme-text-primary">Impacted Tasks</h3>
                    <Button
                        size="sm"
                        variant="secondary"
                        leftIcon="refresh"
                        onClick={() => console.log('Refreshing analysis...')}
                    >
                        Refresh Analysis
                    </Button>
                </div>

                <div className="space-y-3">
                    {MOCK_IMPACTED_TASKS.map((task, index) => (
                        <div key={index} className="bg-theme-surface-elevated rounded-lg p-4 border border-theme-border">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <h4 className="font-medium text-theme-text-primary">{task.task_name}</h4>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(task.impact_score)}`}>
                                        {getImpactLevel(task.impact_score)} Impact
                                    </span>
                                </div>
                                <div className="text-sm text-theme-text-secondary">
                                    {Math.round(task.impact_score * 100)}% similarity
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-theme-text-secondary">Process:</span>
                                    <span className="ml-2 text-theme-text-primary">{task.process_name} v{task.process_version}</span>
                                </div>
                                <div>
                                    <span className="text-theme-text-secondary">Task ID:</span>
                                    <span className="ml-2 text-theme-text-primary font-mono">{task.task_id}</span>
                                </div>
                            </div>

                            <div className="mt-3">
                                <p className="text-sm text-theme-text-secondary">{task.explanation}</p>
                            </div>

                            <div className="mt-3 flex justify-end">
                                <Button
                                    size="sm"
                                    variant="tertiary"
                                    leftIcon="info"
                                    onClick={() => {
                                        setSelectedImpact(task);
                                        setShowDetails(true);
                                    }}
                                >
                                    View Details
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {MOCK_IMPACTED_TASKS.length === 0 && (
                    <div className="text-center py-8 text-theme-text-secondary">
                        <Icon name="graph" size="xl" className="mx-auto mb-4 text-theme-text-muted" />
                        <p>No impacted tasks found</p>
                        <p className="text-sm">Run an analysis to identify potentially affected processes</p>
                    </div>
                )}
            </Card>

            {/* Details Modal (simplified inline) */}
            {showDetails && selectedImpact && (
                <Card variant="outlined" padding="md" className="border-2 border-theme-accent-primary">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-theme-text-primary">Impact Details</h3>
                        <Button
                            size="sm"
                            variant="tertiary"
                            leftIcon="close"
                            onClick={() => setShowDetails(false)}
                        >
                            Close
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium text-theme-text-primary mb-2">{selectedImpact.task_name}</h4>
                            <p className="text-sm text-theme-text-secondary">{selectedImpact.explanation}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-theme-text-secondary">Impact Score:</span>
                                <span className="ml-2 text-theme-text-primary font-medium">
                                    {Math.round(selectedImpact.impact_score * 100)}%
                                </span>
                            </div>
                            <div>
                                <span className="text-theme-text-secondary">Risk Level:</span>
                                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getImpactColor(selectedImpact.impact_score)}`}>
                                    {getImpactLevel(selectedImpact.impact_score)}
                                </span>
                            </div>
                        </div>

                        <Alert variant="info" title="Recommendation">
                            Review this task carefully before implementing process changes. Consider running additional validation tests.
                        </Alert>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default ThreadImpactAnalysis; 