"use client";

import { useEffect, useState } from "react";
import { KernelManager } from '../../components/JupyterLab/KernelManager';
import { NotebookEditor } from '../../components/JupyterLab/NotebookEditor';
import { Alert } from '../../components/shared/Alert';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { Icon } from '../../components/shared/Icon';
import { LoadingState } from '../../components/shared/LoadingState';
import { PageContent, PageLayout } from '../../components/shared/PageLayout';

interface JupyterLabStatus {
    status: 'loading' | 'connected' | 'error' | 'offline';
    message: string;
}

interface Kernel {
    id: string;
    name: string;
    language: string;
    status: 'idle' | 'busy' | 'starting' | 'dead';
}

interface Notebook {
    id: string;
    name: string;
    path: string;
    type: 'notebook' | 'file';
    content?: any;
}

export default function JupyterLabPage() {
    const [status, setStatus] = useState<JupyterLabStatus>({
        status: 'loading',
        message: 'Initializing Jupyter Lab...'
    });
    const [kernels, setKernels] = useState<Kernel[]>([]);
    const [notebooks, setNotebooks] = useState<Notebook[]>([]);
    const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null);
    const [selectedKernel, setSelectedKernel] = useState<Kernel | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Jupyter Lab API URL
    const JUPYTER_API_URL = process.env.NEXT_PUBLIC_JUPYTER_API_URL || 'http://localhost:8888/api';
    const JUPYTER_TOKEN = 'dadms_jupyter_token';

    useEffect(() => {
        // Check if Jupyter Lab API is accessible
        const checkJupyterStatus = async () => {
            try {
                const response = await fetch(`${JUPYTER_API_URL}/status`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `token ${JUPYTER_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    setStatus({
                        status: 'connected',
                        message: 'Jupyter Lab API is running'
                    });
                    await loadKernels();
                    await loadNotebooks();
                } else {
                    throw new Error('API not accessible');
                }
            } catch (error) {
                setStatus({
                    status: 'offline',
                    message: 'Jupyter Lab API is not accessible. Please ensure it is running with API access enabled.'
                });
            }
        };

        checkJupyterStatus();
    }, [JUPYTER_API_URL]);

    const loadKernels = async () => {
        try {
            const response = await fetch(`${JUPYTER_API_URL}/kernels`, {
                headers: {
                    'Authorization': `token ${JUPYTER_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const kernelsData = await response.json();
                setKernels(kernelsData);
            }
        } catch (error) {
            console.error('Failed to load kernels:', error);
        }
    };

    const loadNotebooks = async () => {
        try {
            const response = await fetch(`${JUPYTER_API_URL}/contents`, {
                headers: {
                    'Authorization': `token ${JUPYTER_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const contents = await response.json();
                const notebookFiles = contents.content?.filter((item: any) =>
                    item.type === 'notebook' || item.path.endsWith('.ipynb')
                ) || [];
                setNotebooks(notebookFiles);
            }
        } catch (error) {
            console.error('Failed to load notebooks:', error);
        }
    };

    const createNewNotebook = async () => {
        try {
            const response = await fetch(`${JUPYTER_API_URL}/contents`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${JUPYTER_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'notebook',
                    name: `notebook_${Date.now()}.ipynb`
                })
            });

            if (response.ok) {
                const newNotebook = await response.json();
                setNotebooks(prev => [...prev, newNotebook]);
                setSelectedNotebook(newNotebook);
            }
        } catch (error) {
            console.error('Failed to create notebook:', error);
        }
    };

    const deleteNotebook = async (notebook: Notebook) => {
        try {
            const response = await fetch(`${JUPYTER_API_URL}/contents/${encodeURIComponent(notebook.path)}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `token ${JUPYTER_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setNotebooks(prev => prev.filter(n => n.path !== notebook.path));
                if (selectedNotebook?.path === notebook.path) {
                    setSelectedNotebook(null);
                }
            }
        } catch (error) {
            console.error('Failed to delete notebook:', error);
        }
    };

    const handleFullscreenToggle = () => {
        setIsFullscreen(!isFullscreen);
    };

    const handleRefresh = async () => {
        setStatus({
            status: 'loading',
            message: 'Refreshing Jupyter Lab...'
        });
        await loadKernels();
        await loadNotebooks();
        setStatus({
            status: 'connected',
            message: 'Jupyter Lab API is running'
        });
    };

    const pageActions = (
        <div className="flex items-center gap-2">
            <Button
                variant="primary"
                size="sm"
                leftIcon="add"
                onClick={createNewNotebook}
                disabled={status.status !== 'connected'}
            >
                New Notebook
            </Button>
            <Button
                variant="secondary"
                size="sm"
                leftIcon="refresh"
                onClick={handleRefresh}
                disabled={status.status === 'loading'}
            >
                Refresh
            </Button>
            <Button
                variant="secondary"
                size="sm"
                leftIcon={isFullscreen ? "screen-normal" : "screen-full"}
                onClick={handleFullscreenToggle}
            >
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </Button>
        </div>
    );

    return (
        <PageLayout
            title="Jupyter Lab"
            subtitle="Interactive development environment for prototyping and analysis"
            icon="beaker"
            actions={pageActions}
            status={{
                type: status.status === 'connected' ? 'active' :
                    status.status === 'loading' ? 'pending' : 'error',
                text: status.message
            }}
        >
            <PageContent padding="sm" spacing="sm" maxWidth="full">
                {status.status === 'loading' && (
                    <div className="flex items-center justify-center h-64">
                        <LoadingState text="Connecting to Jupyter Lab..." />
                    </div>
                )}

                {status.status === 'error' && (
                    <Alert
                        variant="error"
                        title="Connection Error"
                        actions={
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleRefresh}
                            >
                                Retry Connection
                            </Button>
                        }
                    >
                        {status.message}
                    </Alert>
                )}

                {status.status === 'offline' && (
                    <Card className="mb-6">
                        <div className="flex items-start space-x-4">
                            <Icon name="warning" className="text-yellow-500 mt-1" />
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                    Jupyter Lab API Not Available
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    {status.message}
                                </p>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                        To enable API access:
                                    </h4>
                                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                        <li>Start Jupyter Lab with API enabled: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">jupyter lab --ip=0.0.0.0 --port=8888 --no-browser --allow-root --ServerApp.token=dadms_jupyter_token --ServerApp.allow_origin='*' --ServerApp.disable_check_xsrf=True</code></li>
                                        <li>Ensure the API endpoint is accessible at: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{JUPYTER_API_URL}</code></li>
                                        <li>Verify the token is correctly configured</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {status.status === 'connected' && (
                    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : 'pt-4 border border-gray-200 dark:border-gray-700 rounded-lg'}`}>
                        {isFullscreen && (
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center space-x-2">
                                    <Icon name="beaker" className="text-blue-500" />
                                    <span className="font-semibold">Jupyter Lab - Fullscreen Mode</span>
                                </div>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    leftIcon="screen-normal"
                                    onClick={handleFullscreenToggle}
                                >
                                    Exit Fullscreen
                                </Button>
                            </div>
                        )}

                        {/* Lab Header */}
                        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        Jupyter Lab Workspace
                                    </h3>
                                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                        <span>•</span>
                                        <span>{kernels.length} kernels</span>
                                        <span>•</span>
                                        <span>{notebooks.length} notebooks</span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        leftIcon="refresh"
                                        onClick={handleRefresh}
                                        disabled={status.status !== 'connected'}
                                    >
                                        Refresh
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        leftIcon={isFullscreen ? "screen-normal" : "screen-full"}
                                        onClick={handleFullscreenToggle}
                                    >
                                        {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className={`${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[calc(100vh-360px)]'} flex`}>
                            {/* Sidebar */}
                            <div className="w-56 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                <div className="p-3">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                        Kernels ({kernels.length})
                                    </h3>
                                    <KernelManager
                                        kernels={kernels}
                                        selectedKernel={selectedKernel}
                                        onKernelSelect={setSelectedKernel}
                                        onRefresh={loadKernels}
                                        apiUrl={JUPYTER_API_URL}
                                        token={JUPYTER_TOKEN}
                                    />
                                </div>

                                <div className="border-t border-gray-200 dark:border-gray-700 p-3">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                        Notebooks ({notebooks.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {notebooks.map((notebook) => (
                                            <div
                                                key={notebook.path || notebook.id || `notebook-${Date.now()}`}
                                                className={`p-1.5 rounded cursor-pointer text-sm group ${selectedNotebook?.path === notebook.path
                                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div
                                                        className="flex items-center space-x-2 flex-1 cursor-pointer"
                                                        onClick={() => setSelectedNotebook(notebook)}
                                                    >
                                                        <Icon name="file-text" className="text-gray-500" />
                                                        <span className="truncate">{notebook.name}</span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteNotebook(notebook);
                                                        }}
                                                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Icon name="trash" size="sm" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="flex-1">
                                {selectedNotebook ? (
                                    <NotebookEditor
                                        notebook={selectedNotebook}
                                        kernel={selectedKernel}
                                        apiUrl={JUPYTER_API_URL}
                                        token={JUPYTER_TOKEN}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center">
                                            <Icon name="file-text" className="text-gray-400 mx-auto mb-4" size="xl" />
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                                No Notebook Selected
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                                Select a notebook from the sidebar or create a new one to get started.
                                            </p>
                                            <Button
                                                variant="primary"
                                                onClick={createNewNotebook}
                                            >
                                                <Icon name="add" className="mr-2" />
                                                Create New Notebook
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Configuration Information */}
                <Card className="mt-4">
                    <div className="flex items-start space-x-4">
                        <Icon name="info" className="text-blue-500 mt-1" />
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                Jupyter Lab API Integration
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                This integration provides native DADMS interface for Jupyter Lab functionality,
                                including kernel management, notebook editing, and code execution.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                        Features
                                    </h4>
                                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                        <li>• Native DADMS interface and theming</li>
                                        <li>• Kernel management and monitoring</li>
                                        <li>• Notebook creation and editing</li>
                                        <li>• Real-time code execution</li>
                                        <li>• Integration with DADMS data sources</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                        Configuration
                                    </h4>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        <p><strong>API URL:</strong> {JUPYTER_API_URL}</p>
                                        <p><strong>Status:</strong> {status.status}</p>
                                        <p><strong>Active Kernels:</strong> {kernels.length}</p>
                                        <p><strong>Notebooks:</strong> {notebooks.length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </PageContent>
        </PageLayout>
    );
} 