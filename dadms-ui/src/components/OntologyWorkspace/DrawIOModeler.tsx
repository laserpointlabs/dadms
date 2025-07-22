'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export interface DrawIOModelerProps {
    className?: string;
    height?: string;
    workspaceId?: string;
    ontologyId?: string;
    onLoad?: () => void;
    onError?: (error: Error) => void;
    onSave?: (xmlData: string, pngData: string) => void;
    onOntologyImport?: (ontologyData: any) => void;
}

export const DrawIOModeler: React.FC<DrawIOModelerProps> = ({
    className = '',
    height = '100vh',
    workspaceId,
    ontologyId,
    onLoad,
    onError,
    onSave,
    onOntologyImport
}) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const { theme } = useTheme();
    const [isLoading, setIsLoading] = useState(true);

    // Send theme changes to the iframe
    useEffect(() => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            try {
                iframeRef.current.contentWindow.postMessage({
                    type: 'theme-change',
                    theme: theme
                }, '*');
            } catch (error) {
                console.warn('Could not send theme message to draw.io modeler:', error);
            }
        }
    }, [theme]);

    // Listen for messages from the draw.io iframe
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.source !== iframeRef.current?.contentWindow) return;

            const { type, data } = event.data;

            switch (type) {
                case 'drawio-ready':
                    setIsLoading(false);
                    onLoad?.();
                    // Send initial configuration
                    iframeRef.current?.contentWindow?.postMessage({
                        type: 'configure',
                        workspaceId,
                        ontologyId,
                        theme
                    }, '*');
                    break;

                case 'drawio-save':
                    onSave?.(data.xmlData, data.pngData);
                    break;

                case 'drawio-error':
                    onError?.(new Error(data.message));
                    break;

                case 'ontology-import-request':
                    // Handle requests to import ontology data into the diagram
                    onOntologyImport?.(data);
                    break;

                case 'cemento-convert':
                    // Handle cemento conversion requests
                    handleCementoConversion(data);
                    break;

                default:
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [workspaceId, ontologyId, onLoad, onError, onSave, onOntologyImport]);

    const handleCementoConversion = async (data: any) => {
        try {
            const response = await fetch(`/api/ontology-workspace/convert/cemento`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    workspaceId,
                    operation: data.operation,
                    sourceFormat: data.sourceFormat,
                    targetFormat: data.targetFormat,
                    content: data.content,
                    options: data.options
                }),
            });

            const result = await response.json();

            // Send result back to iframe
            iframeRef.current?.contentWindow?.postMessage({
                type: 'cemento-result',
                requestId: data.requestId,
                success: result.success,
                data: result.data,
                error: result.error
            }, '*');

        } catch (error) {
            // Send error back to iframe
            iframeRef.current?.contentWindow?.postMessage({
                type: 'cemento-result',
                requestId: data.requestId,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }, '*');
        }
    };

    const handleIframeLoad = () => {
        // Send initial theme to iframe after a small delay
        setTimeout(() => {
            if (iframeRef.current && iframeRef.current.contentWindow) {
                try {
                    iframeRef.current.contentWindow.postMessage({
                        type: 'theme-change',
                        theme: theme
                    }, '*');
                } catch (error) {
                    console.warn('Could not send initial theme to draw.io modeler:', error);
                }
            }
        }, 500);
    };

    const handleIframeError = () => {
        setIsLoading(false);
        onError?.(new Error('Failed to load draw.io modeler'));
    };

    // Public methods that can be called from parent component
    const saveToOntology = () => {
        iframeRef.current?.contentWindow?.postMessage({
            type: 'export-to-ontology'
        }, '*');
    };

    const loadFromOntology = (ontologyData: any) => {
        iframeRef.current?.contentWindow?.postMessage({
            type: 'import-from-ontology',
            data: ontologyData
        }, '*');
    };

    const exportDiagram = (format: 'png' | 'svg' | 'xml' = 'xml') => {
        iframeRef.current?.contentWindow?.postMessage({
            type: 'export-diagram',
            format
        }, '*');
    };

    // Expose methods via ref if needed
    React.useImperativeHandle(React.forwardRef(() => null), () => ({
        saveToOntology,
        loadFromOntology,
        exportDiagram
    }));

    return (
        <div className={`drawio-modeler-container ${className}`} style={{ height, minHeight: height }}>
            {isLoading && (
                <div className="flex items-center justify-center h-full bg-theme-surface">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-accent-primary mx-auto mb-2"></div>
                        <p className="text-theme-text-secondary">Loading Ontology Modeler...</p>
                    </div>
                </div>
            )}
            <iframe
                ref={iframeRef}
                src="/comprehensive_drawio_ontology_modeler.html"
                title="Draw.io Ontology Modeler"
                className="w-full h-full border-0"
                style={{
                    background: 'var(--theme-surface)',
                    transition: 'background-color 0.2s ease',
                    minHeight: '100%',
                    display: isLoading ? 'none' : 'block'
                }}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-modals"
            />
        </div>
    );
}; 