"use client";
import Head from 'next/head';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, AlertDialog, Button, Card, Icon } from '../../components/shared';
import { FormField, Select } from '../../components/shared/FormField';
import { PageLayout } from '../../components/shared/PageLayout';

// Types for user tasks
interface UserTask {
    id: string;
    name: string;
    description?: string;
    processInstanceId: string;
    processDefinitionKey: string;
    processDefinitionName?: string;
    businessKey?: string;
    assignee?: string;
    created: string;
    due?: string;
    priority: number;
    formKey?: string;
    variables?: Record<string, any>;
    status: 'pending' | 'in_progress' | 'completed' | 'overdue';
}

interface TaskFilter {
    status: string;
    priority: string;
    assignee: string;
    processDefinition: string;
}

interface TaskCounts {
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    total: number;
}

// Mock data for development
const MOCK_TASKS: UserTask[] = [
    {
        id: 'task-001',
        name: 'Review Budget Approval',
        description: 'Review and approve the quarterly budget allocation for Q3 2024',
        processInstanceId: 'proc-001',
        processDefinitionKey: 'budget-approval',
        processDefinitionName: 'Budget Approval Process',
        businessKey: 'BUD-2024-Q3',
        assignee: 'john.doe@company.com',
        created: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        due: new Date(Date.now() + 172800000).toISOString(), // 2 days from now
        priority: 2,
        formKey: 'budget-review-form',
        variables: {
            budgetAmount: 500000,
            department: 'Engineering',
            fiscalYear: '2024'
        },
        status: 'pending'
    },
    {
        id: 'task-002',
        name: 'Risk Assessment Review',
        description: 'Complete risk assessment for new product launch',
        processInstanceId: 'proc-002',
        processDefinitionKey: 'risk-assessment',
        processDefinitionName: 'Risk Assessment Process',
        businessKey: 'RISK-PROD-001',
        assignee: 'jane.smith@company.com',
        created: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        due: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago (overdue)
        priority: 1,
        formKey: 'risk-assessment-form',
        variables: {
            productName: 'DADMS 2.0',
            riskLevel: 'Medium',
            stakeholders: ['Engineering', 'Product', 'Legal']
        },
        status: 'overdue'
    },
    {
        id: 'task-003',
        name: 'Contract Approval',
        description: 'Approve vendor contract for cloud services',
        processInstanceId: 'proc-003',
        processDefinitionKey: 'contract-approval',
        processDefinitionName: 'Contract Approval Process',
        businessKey: 'CON-2024-001',
        assignee: 'john.doe@company.com',
        created: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
        due: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
        priority: 3,
        formKey: 'contract-approval-form',
        variables: {
            vendorName: 'CloudCorp Inc',
            contractValue: 250000,
            duration: '12 months'
        },
        status: 'in_progress'
    },
    {
        id: 'task-004',
        name: 'Security Review',
        description: 'Review security requirements for new feature',
        processInstanceId: 'proc-004',
        processDefinitionKey: 'security-review',
        processDefinitionName: 'Security Review Process',
        businessKey: 'SEC-2024-001',
        assignee: 'jane.smith@company.com',
        created: new Date(Date.now() - 21600000).toISOString(), // 6 hours ago
        due: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
        priority: 1,
        formKey: 'security-review-form',
        variables: {
            featureName: 'User Authentication',
            riskLevel: 'High',
            complianceRequired: true
        },
        status: 'pending'
    },
    {
        id: 'task-005',
        name: 'Performance Testing',
        description: 'Complete performance testing for system upgrade',
        processInstanceId: 'proc-005',
        processDefinitionKey: 'performance-testing',
        processDefinitionName: 'Performance Testing Process',
        businessKey: 'PERF-2024-001',
        assignee: 'john.doe@company.com',
        created: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        due: new Date(Date.now() + 43200000).toISOString(), // 12 hours from now
        priority: 2,
        formKey: 'performance-test-form',
        variables: {
            systemVersion: '2.1.0',
            testScenarios: ['Load', 'Stress', 'Endurance'],
            targetTPS: 1000
        },
        status: 'in_progress'
    }
];

const MOCK_COUNTS: TaskCounts = {
    pending: 2,
    inProgress: 2,
    completed: 0,
    overdue: 1,
    total: 5
};

const UserTasksPage: React.FC = () => {
    const [tasks, setTasks] = useState<UserTask[]>(MOCK_TASKS);
    const [counts, setCounts] = useState<TaskCounts>(MOCK_COUNTS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTask, setSelectedTask] = useState<UserTask | null>(null);
    const [completeTaskOpen, setCompleteTaskOpen] = useState(false);
    const [filter, setFilter] = useState<TaskFilter>({
        status: 'all',
        priority: 'all',
        assignee: 'all',
        processDefinition: 'all'
    });
    const [isClient, setIsClient] = useState(false);

    // Fix hydration issue by ensuring we're on client side
    useEffect(() => {
        setIsClient(true);
    }, []);

    const fetchUserTasks = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // TODO: Replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
            setTasks(MOCK_TASKS);
            setCounts(MOCK_COUNTS);
        } catch (err) {
            setError('Failed to fetch user tasks');
            console.error('Error fetching tasks:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleRefresh = () => {
        fetchUserTasks();
    };

    // Auto-refresh every 10 seconds
    useEffect(() => {
        const interval = setInterval(fetchUserTasks, 10000);
        return () => clearInterval(interval);
    }, [fetchUserTasks]);

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'pending': return 'text-theme-accent-warning';
            case 'in_progress': return 'text-theme-accent-primary';
            case 'completed': return 'text-theme-accent-success';
            case 'overdue': return 'text-theme-accent-error';
            default: return 'text-theme-text-secondary';
        }
    };

    const getStatusBgColor = (status: string): string => {
        switch (status) {
            case 'pending': return 'bg-theme-accent-warning bg-opacity-20';
            case 'in_progress': return 'bg-theme-accent-primary bg-opacity-20';
            case 'completed': return 'bg-theme-accent-success bg-opacity-20';
            case 'overdue': return 'bg-theme-accent-error bg-opacity-20';
            default: return 'bg-theme-bg-secondary';
        }
    };

    const getPriorityColor = (priority: number): string => {
        switch (priority) {
            case 1: return 'text-theme-accent-error';
            case 2: return 'text-theme-accent-warning';
            case 3: return 'text-theme-accent-success';
            default: return 'text-theme-text-secondary';
        }
    };

    const getPriorityLabel = (priority: number): string => {
        switch (priority) {
            case 1: return 'High';
            case 2: return 'Medium';
            case 3: return 'Low';
            default: return 'Unknown';
        }
    };

    const formatDateTime = (dateTime: string | undefined) => {
        if (!dateTime || !isClient) return 'N/A';
        return new Date(dateTime).toLocaleString();
    };

    const getTimeUntilDue = (dueDate: string | undefined) => {
        if (!dueDate || !isClient) return 'No due date';
        const due = new Date(dueDate);
        const now = new Date();
        const diffMs = due.getTime() - now.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (diffMs < 0) {
            return `${Math.abs(diffDays)}d ${Math.abs(diffHours)}h overdue`;
        }
        if (diffDays > 0) return `${diffDays}d ${diffHours}h remaining`;
        if (diffHours > 0) return `${diffHours}h remaining`;
        return 'Due soon';
    };

    const handleCompleteTask = () => {
        if (selectedTask) {
            // TODO: Implement actual task completion via Camunda API
            console.log('Completing task:', selectedTask.id);
            setCompleteTaskOpen(false);
            setSelectedTask(null);
        }
    };

    const handleClaimTask = (taskId: string) => {
        // TODO: Implement task claiming via Camunda API
        console.log('Claiming task:', taskId);
    };

    const handleUnclaimTask = (taskId: string) => {
        // TODO: Implement task unclaiming via Camunda API
        console.log('Unclaiming task:', taskId);
    };

    const filteredTasks = tasks.filter(task => {
        if (filter.status !== 'all' && task.status !== filter.status) return false;
        if (filter.priority !== 'all' && task.priority.toString() !== filter.priority) return false;
        if (filter.assignee !== 'all' && task.assignee !== filter.assignee) return false;
        if (filter.processDefinition !== 'all' && task.processDefinitionKey !== filter.processDefinition) return false;
        return true;
    });

    const pageActions = (
        <>
            <Button
                variant="tertiary"
                leftIcon="refresh"
                onClick={handleRefresh}
                disabled={loading}
                loading={loading}
            >
                Refresh
            </Button>
        </>
    );

    return (
        <>
            <Head>
                <title>User Tasks - DADMS</title>
                <meta name="description" content="Manage and complete manual tasks from BPMN processes" />
            </Head>
            <PageLayout
                title="User Tasks"
                subtitle="Manage and complete manual tasks from BPMN processes"
                icon="files"
                actions={pageActions}
                status={{
                    text: `${counts.pending} Pending, ${counts.overdue} Overdue`,
                    type: counts.overdue > 0 ? 'error' : 'active'
                }}
            >
                <div className="space-y-6">
                    {/* Error Alert */}
                    {error && (
                        <Alert variant="error" title="Error" onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <Card variant="default" padding="sm">
                            <div className="text-center">
                                <div className="flex items-center justify-center w-10 h-10 bg-theme-accent-warning bg-opacity-20 rounded-lg mx-auto mb-2">
                                    <Icon name="warning" size="md" className="text-theme-accent-warning" />
                                </div>
                                <p className="text-xs text-theme-text-secondary mb-1">Pending</p>
                                <p className="text-xl font-bold text-theme-accent-warning">{counts.pending}</p>
                            </div>
                        </Card>
                        <Card variant="default" padding="sm">
                            <div className="text-center">
                                <div className="flex items-center justify-center w-10 h-10 bg-theme-accent-primary bg-opacity-20 rounded-lg mx-auto mb-2">
                                    <Icon name="pulse" size="md" className="text-theme-accent-primary" />
                                </div>
                                <p className="text-xs text-theme-text-secondary mb-1">In Progress</p>
                                <p className="text-xl font-bold text-theme-accent-primary">{counts.inProgress}</p>
                            </div>
                        </Card>
                        <Card variant="default" padding="sm">
                            <div className="text-center">
                                <div className="flex items-center justify-center w-10 h-10 bg-theme-accent-success bg-opacity-20 rounded-lg mx-auto mb-2">
                                    <Icon name="check" size="md" className="text-theme-accent-success" />
                                </div>
                                <p className="text-xs text-theme-text-secondary mb-1">Completed</p>
                                <p className="text-xl font-bold text-theme-accent-success">{counts.completed}</p>
                            </div>
                        </Card>
                        <Card variant="default" padding="sm">
                            <div className="text-center">
                                <div className="flex items-center justify-center w-10 h-10 bg-theme-accent-error bg-opacity-20 rounded-lg mx-auto mb-2">
                                    <Icon name="error" size="md" className="text-theme-accent-error" />
                                </div>
                                <p className="text-xs text-theme-text-secondary mb-1">Overdue</p>
                                <p className="text-xl font-bold text-theme-accent-error">{counts.overdue}</p>
                            </div>
                        </Card>
                        <Card variant="default" padding="sm">
                            <div className="text-center">
                                <div className="flex items-center justify-center w-10 h-10 bg-theme-bg-secondary rounded-lg mx-auto mb-2">
                                    <Icon name="files" size="md" className="text-theme-text-primary" />
                                </div>
                                <p className="text-xs text-theme-text-secondary mb-1">Total</p>
                                <p className="text-xl font-bold text-theme-text-primary">{counts.total}</p>
                            </div>
                        </Card>
                    </div>

                    {/* Filters */}
                    <Card variant="default" padding="sm">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <FormField label="Status">
                                <Select
                                    value={filter.status}
                                    onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="overdue">Overdue</option>
                                </Select>
                            </FormField>
                            <FormField label="Priority">
                                <Select
                                    value={filter.priority}
                                    onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))}
                                >
                                    <option value="all">All Priorities</option>
                                    <option value="1">High</option>
                                    <option value="2">Medium</option>
                                    <option value="3">Low</option>
                                </Select>
                            </FormField>
                            <FormField label="Assignee">
                                <Select
                                    value={filter.assignee}
                                    onChange={(e) => setFilter(prev => ({ ...prev, assignee: e.target.value }))}
                                >
                                    <option value="all">All Assignees</option>
                                    <option value="john.doe@company.com">John Doe</option>
                                    <option value="jane.smith@company.com">Jane Smith</option>
                                </Select>
                            </FormField>
                            <FormField label="Process">
                                <Select
                                    value={filter.processDefinition}
                                    onChange={(e) => setFilter(prev => ({ ...prev, processDefinition: e.target.value }))}
                                >
                                    <option value="all">All Processes</option>
                                    <option value="budget-approval">Budget Approval</option>
                                    <option value="risk-assessment">Risk Assessment</option>
                                    <option value="contract-approval">Contract Approval</option>
                                    <option value="security-review">Security Review</option>
                                    <option value="performance-testing">Performance Testing</option>
                                </Select>
                            </FormField>
                        </div>
                    </Card>

                    {/* User Tasks Table */}
                    <Card variant="default" padding="none">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-theme-border">
                                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider">Task</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider">Process</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider">Assignee</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider">Priority</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider">Due Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-theme-border">
                                    {filteredTasks.map((task) => (
                                        <tr key={task.id} className="hover:bg-theme-bg-secondary">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-medium text-theme-text-primary">{task.name}</p>
                                                    {task.description && (
                                                        <p className="text-xs text-theme-text-secondary mt-1">{task.description}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="text-sm text-theme-text-primary">{task.processDefinitionName}</p>
                                                    <p className="text-xs text-theme-text-secondary">{task.businessKey}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm text-theme-text-primary">{task.assignee || 'Unassigned'}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                                    {getPriorityLabel(task.priority)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)} ${getStatusBgColor(task.status)}`}>
                                                    {task.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="text-sm text-theme-text-primary">{formatDateTime(task.due)}</p>
                                                    <p className="text-xs text-theme-text-secondary">{getTimeUntilDue(task.due)}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex space-x-2">
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedTask(task);
                                                            setCompleteTaskOpen(true);
                                                        }}
                                                    >
                                                        Complete
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => setSelectedTask(task)}
                                                    >
                                                        Details
                                                    </Button>
                                                    {task.assignee ? (
                                                        <Button
                                                            variant="tertiary"
                                                            size="sm"
                                                            onClick={() => handleUnclaimTask(task.id)}
                                                        >
                                                            Unclaim
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="tertiary"
                                                            size="sm"
                                                            onClick={() => handleClaimTask(task.id)}
                                                        >
                                                            Claim
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {filteredTasks.length === 0 && (
                            <div className="text-center py-8">
                                <Icon name="files" size="lg" className="text-theme-text-secondary mx-auto mb-4" />
                                <p className="text-theme-text-secondary">No tasks found</p>
                                <p className="text-sm text-theme-text-secondary mt-1">Try adjusting your filters</p>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Task Detail Modal */}
                <AlertDialog
                    open={!!selectedTask && !completeTaskOpen}
                    onClose={() => setSelectedTask(null)}
                    title="Task Details"
                    description="View detailed information about this user task"
                    onConfirm={() => setSelectedTask(null)}
                    confirmText="Close"
                />

                {/* Complete Task Modal */}
                <AlertDialog
                    open={completeTaskOpen}
                    onClose={() => setCompleteTaskOpen(false)}
                    title="Complete Task"
                    description="Are you sure you want to complete this task? This action cannot be undone."
                    onConfirm={handleCompleteTask}
                    confirmText="Complete Task"
                    cancelText="Cancel"
                />
            </PageLayout>
        </>
    );
};

export default UserTasksPage; 