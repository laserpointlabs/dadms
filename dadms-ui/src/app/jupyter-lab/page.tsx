"use client";

import { useEffect, useState } from "react";
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

export default function JupyterLabPage() {
    const [status, setStatus] = useState<JupyterLabStatus>({
        status: 'loading',
        message: 'Initializing Jupyter Lab...'
    });
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Jupyter Lab URL - in production this would be configurable
    const JUPYTER_LAB_URL = process.env.NEXT_PUBLIC_JUPYTER_LAB_URL || 'http://localhost:8888';
    const JUPYTER_TOKEN = 'dadms_jupyter_token';

    useEffect(() => {
        // Check if Jupyter Lab is accessible
        const checkJupyterStatus = async () => {
            try {
                // Try to access the main page instead of API to avoid auth issues
                const response = await fetch(`${JUPYTER_LAB_URL}/`, {
                    method: 'GET',
                    mode: 'no-cors' // Handle CORS issues in development
                });
                setStatus({
                    status: 'connected',
                    message: 'Jupyter Lab is running'
                });
            } catch (error) {
                setStatus({
                    status: 'offline',
                    message: 'Jupyter Lab is not accessible. Please ensure it is running on the configured URL.'
                });
            }
        };

        checkJupyterStatus();

        // Check if iframe is blocked after a short delay
        const checkIframeBlocked = () => {
            setTimeout(() => {
                const iframe = document.getElementById('jupyter-iframe') as HTMLIFrameElement;
                const fallback = document.getElementById('jupyter-fallback');

                if (iframe && fallback) {
                    try {
                        // Try to access iframe content - if blocked, this will throw
                        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                        if (!iframeDoc) {
                            // Iframe is blocked, show fallback
                            iframe.style.display = 'none';
                            fallback.classList.remove('hidden');
                        }
                    } catch (error) {
                        // Iframe is blocked, show fallback
                        iframe.style.display = 'none';
                        fallback.classList.remove('hidden');
                    }
                }
            }, 2000); // Wait 2 seconds for iframe to load
        };

        if (status.status === 'connected') {
            checkIframeBlocked();
        }
    }, [JUPYTER_LAB_URL, status.status]);

    const handleFullscreenToggle = () => {
        setIsFullscreen(!isFullscreen);
    };

    const handleRefresh = () => {
        setStatus({
            status: 'loading',
            message: 'Refreshing Jupyter Lab...'
        });
        // Force iframe refresh
        const iframe = document.getElementById('jupyter-iframe') as HTMLIFrameElement;
        if (iframe) {
            iframe.src = iframe.src;
        }
    };

    const pageActions = (
        <div className="flex items-center gap-2">
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
                leftIcon="external-link"
                onClick={() => window.open(`${JUPYTER_LAB_URL}/lab?token=${JUPYTER_TOKEN}`, '_blank')}
            >
                Open in New Tab
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
                type: status.status === 'connected' ? 'success' :
                    status.status === 'loading' ? 'info' : 'error',
                message: status.message
            }}
        >
            <PageContent>
                {status.status === 'loading' && (
                    <div className="flex items-center justify-center h-64">
                        <LoadingState message="Connecting to Jupyter Lab..." />
                    </div>
                )}

                {status.status === 'error' && (
                    <Alert
                        type="error"
                        title="Connection Error"
                        message={status.message}
                        actions={
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleRefresh}
                            >
                                Retry Connection
                            </Button>
                        }
                    />
                )}

                {status.status === 'offline' && (
                    <Card className="mb-6">
                        <div className="flex items-start space-x-4">
                            <Icon name="warning" className="text-yellow-500 mt-1" />
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                    Jupyter Lab Not Available
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    {status.message}
                                </p>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                        To start Jupyter Lab:
                                    </h4>
                                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                        <li>Install Jupyter Lab: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">pip install jupyterlab</code></li>
                                        <li>Start Jupyter Lab: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">jupyter lab --ip=0.0.0.0 --port=8888 --no-browser</code></li>
                                        <li>Set the token in your environment or configure authentication</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {status.status === 'connected' && (
                    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : ''}`}>
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

                        <div className={`${isFullscreen ? 'h-[calc(100vh-80px)]' : 'h-[calc(100vh-300px)]'} relative`}>
                            {/* Try iframe first, fallback to new tab approach */}
                            <iframe
                                id="jupyter-iframe"
                                src={`${JUPYTER_LAB_URL}/lab?token=${JUPYTER_TOKEN}`}
                                className="w-full h-full border border-gray-200 dark:border-gray-700 rounded-lg"
                                title="Jupyter Lab"
                                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation"
                                loading="lazy"
                                allow="fullscreen"
                                onError={() => {
                                    // If iframe fails, show fallback
                                    const iframe = document.getElementById('jupyter-iframe') as HTMLIFrameElement;
                                    if (iframe) {
                                        iframe.style.display = 'none';
                                    }
                                }}
                            />

                            {/* Fallback content for when iframe is blocked */}
                            <div id="jupyter-fallback" className="hidden flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800">
                                <div className="text-center max-w-md">
                                    <Icon name="beaker" className="text-blue-500 mx-auto mb-4" size="xl" />
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                        Jupyter Lab Ready
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                                        Due to security restrictions, Jupyter Lab opens in a new tab for the best experience.
                                    </p>
                                    <div className="space-y-3">
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            onClick={() => window.open(`${JUPYTER_LAB_URL}/lab?token=${JUPYTER_TOKEN}`, '_blank')}
                                            className="w-full"
                                        >
                                            <Icon name="beaker" className="mr-2" />
                                            Open Jupyter Lab
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${JUPYTER_LAB_URL}/lab?token=${JUPYTER_TOKEN}`);
                                            }}
                                        >
                                            <Icon name="copy" className="mr-2" />
                                            Copy URL
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Configuration Information */}
                <Card className="mt-6">
                    <div className="flex items-start space-x-4">
                        <Icon name="info" className="text-blue-500 mt-1" />
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                Jupyter Lab Integration
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                This integration provides a seamless development environment for data analysis,
                                prototyping, and interactive computing within DADMS.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                        Features
                                    </h4>
                                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                        <li>• Interactive notebooks for data analysis</li>
                                        <li>• Python, R, and Julia kernel support</li>
                                        <li>• Real-time collaboration capabilities</li>
                                        <li>• Integration with DADMS data sources</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                        Configuration
                                    </h4>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        <p><strong>URL:</strong> {JUPYTER_LAB_URL}</p>
                                        <p><strong>Status:</strong> {status.status}</p>
                                        <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
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