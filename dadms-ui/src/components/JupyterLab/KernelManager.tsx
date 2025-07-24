"use client";

import { useState } from "react";
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';
import { Icon } from '../shared/Icon';

interface Kernel {
    id: string;
    name: string;
    language: string;
    status: 'idle' | 'busy' | 'starting' | 'dead';
    execution_state?: 'idle' | 'busy' | 'starting' | 'dead';
}

interface KernelManagerProps {
    kernels: Kernel[];
    selectedKernel: Kernel | null;
    onKernelSelect: (kernel: Kernel) => void;
    onRefresh: () => void;
    apiUrl: string;
    token: string;
}

export function KernelManager({ kernels, selectedKernel, onKernelSelect, onRefresh, apiUrl, token }: KernelManagerProps) {
    const [isStarting, setIsStarting] = useState(false);

    const getStatusColor = (status: string, executionState?: string) => {
        const effectiveStatus = executionState || status;
        switch (effectiveStatus) {
            case 'idle': return 'text-green-500';
            case 'busy': return 'text-yellow-500';
            case 'starting': return 'text-blue-500';
            case 'dead': return 'text-red-500';
            default: return 'text-gray-500';
        }
    };

    const getStatusIcon = (status: string, executionState?: string) => {
        const effectiveStatus = executionState || status;
        switch (effectiveStatus) {
            case 'idle': return 'circle';
            case 'busy': return 'sync';
            case 'starting': return 'loading';
            case 'dead': return 'error';
            default: return 'circle';
        }
    };

    const startNewKernel = async () => {
        setIsStarting(true);
        try {
            const response = await fetch(`${apiUrl}/kernels`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: 'python3',
                    path: '/'
                })
            });

            if (response.ok) {
                const newKernel = await response.json();
                console.log('New kernel started:', newKernel);
                onRefresh();
            } else {
                console.error('Failed to start kernel:', response.statusText);
            }
        } catch (error) {
            console.error('Error starting kernel:', error);
        } finally {
            setIsStarting(false);
        }
    };

    const stopKernel = async (kernelId: string) => {
        try {
            const response = await fetch(`${apiUrl}/kernels/${kernelId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                console.log('Kernel stopped:', kernelId);
                onRefresh();
            } else {
                console.error('Failed to stop kernel:', response.statusText);
            }
        } catch (error) {
            console.error('Error stopping kernel:', error);
        }
    };

    const restartKernel = async (kernelId: string) => {
        try {
            const response = await fetch(`${apiUrl}/kernels/${kernelId}/restart`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                console.log('Kernel restarted:', kernelId);
                onRefresh();
            } else {
                console.error('Failed to restart kernel:', response.statusText);
            }
        } catch (error) {
            console.error('Error restarting kernel:', error);
        }
    };

    return (
        <div className="space-y-3">
            {/* Kernel List */}
            <div className="space-y-2">
                {kernels.map((kernel) => (
                    <Card key={kernel.id} variant="default" padding="sm">
                        <div className="flex items-center justify-between">
                            <div
                                className="flex items-center space-x-2 flex-1 cursor-pointer"
                                onClick={() => onKernelSelect(kernel)}
                            >
                                <Icon
                                    name={getStatusIcon(kernel.status, kernel.execution_state)}
                                    className={`${getStatusColor(kernel.status, kernel.execution_state)} ${(kernel.status === 'busy' || kernel.execution_state === 'busy') ? 'animate-spin' : ''}`}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                        {kernel.name}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {kernel.language} • {kernel.execution_state || kernel.status}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                {selectedKernel?.id === kernel.id && (
                                    <Icon name="check" className="text-blue-500" />
                                )}
                                <button
                                    onClick={() => restartKernel(kernel.id)}
                                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                    title="Restart kernel"
                                >
                                    <Icon name="refresh" size="sm" />
                                </button>
                                <button
                                    onClick={() => stopKernel(kernel.id)}
                                    disabled={kernel.status === 'dead'}
                                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                                    title="Stop kernel"
                                >
                                    <Icon name="stop" size="sm" />
                                </button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Actions */}
            <div className="space-y-2">
                <Button
                    variant="secondary"
                    size="sm"
                    leftIcon="add"
                    onClick={startNewKernel}
                    disabled={isStarting}
                    className="w-full"
                >
                    {isStarting ? 'Starting...' : 'Start New Kernel'}
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    leftIcon="refresh"
                    onClick={onRefresh}
                    className="w-full"
                >
                    Refresh
                </Button>
            </div>

            {/* No Kernels State */}
            {kernels.length === 0 && (
                <div className="text-center py-4">
                    <Icon name="circle" className="text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        No kernels running
                    </p>
                </div>
            )}
        </div>
    );
} 