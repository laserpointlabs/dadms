"use client";

import { useState } from 'react';
import { BPMNModeler } from '../../components/BPMNWorkspace/BPMNModeler';
import { Alert } from '../../components/shared/Alert';
import { Button } from '../../components/shared/Button';
import { LoadingState } from '../../components/shared/LoadingState';
import { PageLayout } from '../../components/shared/PageLayout';

export default function BPMNWorkspacePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleModelerLoad = () => {
        console.log('BPMN modeler loaded successfully');
        setIsLoading(false);
        setError(null);
    };

    const handleModelerError = (error: Error) => {
        console.error('BPMN modeler error:', error);
        setIsLoading(false);
        setError(error.message);
    };

    const handleRefresh = () => {
        setIsLoading(true);
        setError(null);
        // Force iframe reload by changing src
        window.location.reload();
    };

    const pageActions = (
        <div className="flex items-center gap-2">
            <Button
                variant="secondary"
                size="sm"
                leftIcon="refresh"
                onClick={handleRefresh}
                disabled={isLoading}
            >
                Refresh
            </Button>
            <Button
                variant="secondary"
                size="sm"
                leftIcon="arrow-right"
                onClick={() => window.open('/comprehensive_bpmn_modeler.html', '_blank')}
            >
                Open in New Tab
            </Button>
        </div>
    );

    return (
        <PageLayout
            title="BPMN Workspace"
            subtitle="Design and manage business process workflows with AI-enhanced collaboration"
            icon="type-hierarchy"
            actions={pageActions}
            status={{
                text: isLoading ? 'Loading Modeler...' : 'Modeler Ready',
                type: isLoading ? 'pending' : 'active'
            }}
        >
            <div className="relative w-full" style={{ height: 'calc(100vh - 164px)' }}>
                {error && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-theme-surface bg-opacity-95">
                        <div className="max-w-md w-full p-4">
                            <Alert
                                variant="error"
                                title="BPMN Modeler Error"
                                actions={
                                    <Button variant="primary" onClick={handleRefresh}>
                                        Retry
                                    </Button>
                                }
                            >
                                {error}
                            </Alert>
                        </div>
                    </div>
                )}

                {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-theme-surface">
                        <LoadingState
                            text="Loading BPMN modeler..."
                            size="lg"
                        />
                    </div>
                )}

                <BPMNModeler
                    height="100%"
                    onLoad={handleModelerLoad}
                    onError={handleModelerError}
                    className="absolute inset-0 w-full h-full"
                />
            </div>
        </PageLayout>
    );
} 