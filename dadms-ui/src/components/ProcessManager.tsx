"use client";
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, AlertDialog, Button, Card, Icon } from './shared';
import { FormField, Select } from './shared/FormField';

// Mock types
interface ProcessInstance {
    id: string;
    processDefinitionKey: string;
    processDefinitionName?: string;
    processDefinitionVersion?: number;
    startTime: string;
    endTime?: string;
    state?: string;
    status: string;
    isActive: boolean;
    businessKey?: string;
}

interface ProcessDefinition {
    id: string;
    key: string;
    name: string;
    version: number;
    resource: string;
    deploymentId: string;
}

interface GroupedProcessDefinitions {
    [key: string]: ProcessDefinition[];
}

interface ProcessCounts {
    active: number;
    total: number;
    completed: number;
}

const MOCK_DEFINITIONS: GroupedProcessDefinitions = {
    'invoice': [
        { id: 'def1', key: 'invoice', name: 'Invoice Process', version: 1, resource: 'invoice.bpmn', deploymentId: 'dep1' },
        { id: 'def2', key: 'invoice', name: 'Invoice Process', version: 2, resource: 'invoice.bpmn', deploymentId: 'dep2' },
    ],
    'approval': [
        { id: 'def3', key: 'approval', name: 'Approval Process', version: 1, resource: 'approval.bpmn', deploymentId: 'dep3' },
    ]
};

const MOCK_INSTANCES: ProcessInstance[] = [
    { id: 'inst1', processDefinitionKey: 'invoice', processDefinitionName: 'Invoice Process', processDefinitionVersion: 2, startTime: new Date().toISOString(), status: 'ACTIVE', isActive: true, businessKey: 'INV-001' },
    { id: 'inst2', processDefinitionKey: 'approval', processDefinitionName: 'Approval Process', processDefinitionVersion: 1, startTime: new Date(Date.now() - 3600000).toISOString(), endTime: new Date().toISOString(), status: 'COMPLETED', isActive: false, businessKey: 'APP-123' },
];

const MOCK_COUNTS: ProcessCounts = { active: 1, total: 2, completed: 1 };

const ProcessManager: React.FC = () => {
    const [processInstances, setProcessInstances] = useState<ProcessInstance[]>(MOCK_INSTANCES);
    const [groupedProcessDefinitions, setGroupedProcessDefinitions] = useState<GroupedProcessDefinitions>(MOCK_DEFINITIONS);
    const [counts, setCounts] = useState<ProcessCounts>(MOCK_COUNTS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedInstance, setSelectedInstance] = useState<ProcessInstance | null>(null);
    const [startDialogOpen, setStartDialogOpen] = useState(false);
    const [selectedDefinition, setSelectedDefinition] = useState<ProcessDefinition | null>(null);
    const [startVariables, setStartVariables] = useState('{}');
    const [selectedVersions, setSelectedVersions] = useState<{ [key: string]: string }>({});
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Placeholder fetch functions
    const fetchProcessInstances = useCallback(async () => {
        // TODO: Replace with real API call
        setProcessInstances(MOCK_INSTANCES);
        setCounts(MOCK_COUNTS);
    }, []);

    const fetchProcessDefinitions = useCallback(async () => {
        // TODO: Replace with real API call
        setGroupedProcessDefinitions(MOCK_DEFINITIONS);
    }, []);

    const handleRefresh = useCallback(async () => {
        setLoading(true);
        await Promise.all([fetchProcessInstances(), fetchProcessDefinitions()]);
        setLoading(false);
    }, [fetchProcessInstances, fetchProcessDefinitions]);

    useEffect(() => {
        handleRefresh();
    }, [handleRefresh]);

    // Auto-refresh effect
    useEffect(() => {
        if (autoRefresh) {
            const interval = setInterval(() => {
                fetchProcessInstances();
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh, fetchProcessInstances]);

    const getStatusColor = (status: string, isActive: boolean): string => {
        if (isActive) return 'text-theme-accent-success';
        if (status === 'COMPLETED') return 'text-theme-accent-info';
        if (status === 'EXTERNALLY_TERMINATED' || status === 'INTERNALLY_TERMINATED') return 'text-theme-accent-error';
        return 'text-theme-text-secondary';
    };

    const getStatusBgColor = (status: string, isActive: boolean): string => {
        if (isActive) return 'bg-theme-accent-success bg-opacity-20';
        if (status === 'COMPLETED') return 'bg-theme-accent-info bg-opacity-20';
        if (status === 'EXTERNALLY_TERMINATED' || status === 'INTERNALLY_TERMINATED') return 'bg-theme-accent-error bg-opacity-20';
        return 'bg-theme-surface-hover';
    };

    const formatDateTime = (dateTime: string | undefined) => {
        if (!dateTime) return 'N/A';
        return new Date(dateTime).toLocaleString();
    };

    const getDuration = (startTime: string, endTime?: string) => {
        const start = new Date(startTime);
        const end = endTime ? new Date(endTime) : new Date();
        const durationMs = end.getTime() - start.getTime();
        const seconds = Math.floor(durationMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    };

    const handleStartProcess = () => {
        if (selectedDefinition) {
            // TODO: Implement actual process start
            console.log('Starting process:', selectedDefinition.key, 'with variables:', startVariables);
            setStartDialogOpen(false);
            setStartVariables('{}');
        }
    };

    const handleDeleteInstance = () => {
        if (selectedInstance) {
            // TODO: Implement actual process deletion
            setProcessInstances(prev => prev.filter(p => p.id !== selectedInstance.id));
            setDeleteDialogOpen(false);
            setSelectedInstance(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-theme-text-primary">Process Management</h1>
                <div className="flex items-center gap-4">
                    {/* Auto-refresh toggle */}
                    <label className="flex items-center gap-2 text-sm text-theme-text-secondary">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="text-theme-accent-primary"
                        />
                        Auto-refresh (5s)
                    </label>
                    <Button
                        variant="primary"
                        leftIcon="refresh"
                        onClick={handleRefresh}
                        disabled={loading}
                        loading={loading}
                    >
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <Alert variant="error" title="Error" onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card variant="default" padding="md">
                    <div className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-theme-accent-success bg-opacity-20 rounded-lg mx-auto mb-3">
                            <Icon name="circle-filled" size="lg" className="text-theme-accent-success" />
                        </div>
                        <p className="text-sm text-theme-text-secondary mb-1">Active Processes</p>
                        <p className="text-3xl font-bold text-theme-accent-success">{counts.active}</p>
                    </div>
                </Card>
                <Card variant="default" padding="md">
                    <div className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-theme-accent-primary bg-opacity-20 rounded-lg mx-auto mb-3">
                            <Icon name="graph" size="lg" className="text-theme-accent-primary" />
                        </div>
                        <p className="text-sm text-theme-text-secondary mb-1">Total Processes</p>
                        <p className="text-3xl font-bold text-theme-text-primary">{counts.total}</p>
                    </div>
                </Card>
                <Card variant="default" padding="md">
                    <div className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-theme-accent-info bg-opacity-20 rounded-lg mx-auto mb-3">
                            <Icon name="file" size="lg" className="text-theme-accent-info" />
                        </div>
                        <p className="text-sm text-theme-text-secondary mb-1">Available Definitions</p>
                        <p className="text-3xl font-bold text-theme-accent-info">{Object.keys(groupedProcessDefinitions).length}</p>
                    </div>
                </Card>
            </div>

            {/* Process Definitions Section */}
            <Card variant="default" padding="md">
                <div className="flex items-center gap-2 mb-4">
                    <Icon name="settings-gear" size="md" className="text-theme-accent-primary" />
                    <h2 className="text-xl font-semibold text-theme-text-primary">Process Definitions</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(groupedProcessDefinitions).map(([key, definitions]) => {
                        const selectedVersion = selectedVersions[key] || definitions[0]?.id || '';
                        const selectedDefinition = definitions.find(def => def.id === selectedVersion) || definitions[0];
                        return (
                            <Card key={key} variant="outlined" padding="md">
                                <div className="space-y-3">
                                    <div>
                                        <h3 className="font-medium text-theme-text-primary truncate">
                                            {selectedDefinition?.name || key}
                                        </h3>
                                        <p className="text-sm text-theme-text-secondary">Key: {key}</p>
                                    </div>

                                    <FormField label="Version">
                                        <Select
                                            value={selectedVersion}
                                            onChange={(e) => setSelectedVersions(prev => ({
                                                ...prev,
                                                [key]: e.target.value
                                            }))}
                                        >
                                            {definitions.map((def) => (
                                                <option key={def.id} value={def.id}>
                                                    v{def.version} {def.version === Math.max(...definitions.map(d => d.version)) ? '(latest)' : ''}
                                                </option>
                                            ))}
                                        </Select>
                                    </FormField>

                                    <div className="flex justify-between items-center pt-2">
                                        <div className="flex gap-1">
                                            <Button
                                                size="sm"
                                                variant="primary"
                                                leftIcon="arrow-right"
                                                onClick={() => {
                                                    setSelectedDefinition(selectedDefinition);
                                                    setStartDialogOpen(true);
                                                }}
                                                disabled={!selectedDefinition}
                                            >
                                                Start
                                            </Button>
                                            <div title="View process documentation">
                                                <Button
                                                    size="sm"
                                                    variant="tertiary"
                                                    leftIcon="info"
                                                    onClick={() => { }}
                                                />
                                            </div>
                                            <div title="View process model">
                                                <Button
                                                    size="sm"
                                                    variant="tertiary"
                                                    leftIcon="file"
                                                    onClick={() => { }}
                                                />
                                            </div>
                                        </div>
                                        <div title="Delete process definition">
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                leftIcon="trash"
                                                onClick={() => { }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </Card>

            {/* Process Instances Table */}
            <Card variant="default" padding="none">
                <div className="p-4 border-b border-theme-border">
                    <h2 className="text-xl font-semibold text-theme-text-primary">Process Instances</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-theme-surface-hover">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-theme-text-secondary">Instance ID</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-theme-text-secondary">Process Name</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-theme-text-secondary">Status</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-theme-text-secondary">Start Time</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-theme-text-secondary">Duration</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-theme-text-secondary">Business Key</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-theme-text-secondary">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme-border">
                            {processInstances.map((instance) => (
                                <tr key={instance.id} className="hover:bg-theme-surface-hover">
                                    <td className="px-4 py-3">
                                        <span className="text-sm font-mono text-theme-text-primary">
                                            {instance.id.substring(0, 8)}...
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="text-sm text-theme-text-primary">
                                                {instance.processDefinitionName || instance.processDefinitionKey}
                                            </p>
                                            <p className="text-xs text-theme-text-secondary">
                                                v{instance.processDefinitionVersion}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBgColor(instance.status, instance.isActive)} ${getStatusColor(instance.status, instance.isActive)}`}>
                                            {instance.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-theme-text-primary">
                                        {formatDateTime(instance.startTime)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-theme-text-primary">
                                        {getDuration(instance.startTime, instance.endTime)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-theme-text-primary">
                                        {instance.businessKey || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1">
                                            <div title="View details">
                                                <Button
                                                    size="sm"
                                                    variant="tertiary"
                                                    leftIcon="search"
                                                    onClick={() => { }}
                                                />
                                            </div>
                                            {instance.isActive && (
                                                <div title="View incidents">
                                                    <Button
                                                        size="sm"
                                                        variant="tertiary"
                                                        leftIcon="warning"
                                                        onClick={() => { }}
                                                    />
                                                </div>
                                            )}
                                            <div title="Delete instance">
                                                <Button
                                                    size="sm"
                                                    variant="danger"
                                                    leftIcon="trash"
                                                    onClick={() => {
                                                        setSelectedInstance(instance);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Start Process Dialog */}
            <AlertDialog
                open={startDialogOpen}
                onClose={() => setStartDialogOpen(false)}
                title="Start Process Instance"
                description={`Starting process: ${selectedDefinition?.name}. You can provide initial variables for the process instance in JSON format.`}
                onConfirm={handleStartProcess}
                confirmText="Start Process"
            />

            {/* Delete Instance Dialog */}
            <AlertDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                title="Delete Process Instance"
                description={`Are you sure you want to delete process instance ${selectedInstance?.id}? This action cannot be undone.`}
                onConfirm={handleDeleteInstance}
                confirmText="Delete"
                variant="error"
            />
        </div>
    );
};

export default ProcessManager; 