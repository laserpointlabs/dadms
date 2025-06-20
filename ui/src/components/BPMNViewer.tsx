import React, { useEffect, useRef, useState } from 'react';
import './BPMNViewer.css';

interface BPMNViewerProps {
    bpmnXml: string;
    onElementClick?: (element: any) => void;
    onModelChange?: (xml: string) => void;
    editable?: boolean;
}

// Declare bpmn-js types
declare global {
    interface Window {
        BpmnJS: any;
    }
}

const BPMNViewer: React.FC<BPMNViewerProps> = ({
    bpmnXml,
    onElementClick,
    onModelChange,
    editable = false
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [viewer, setViewer] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load bpmn-js dynamically
    useEffect(() => {
        const loadBpmnJs = async () => {
            try {
                // Check if bpmn-js is already loaded
                if (window.BpmnJS) {
                    initializeViewer();
                    return;
                }

                // Load bpmn-js from CDN
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/bpmn-js@latest/dist/bpmn-viewer.production.min.js';
                script.onload = () => {
                    initializeViewer();
                };
                script.onerror = () => {
                    setError('Failed to load BPMN viewer library');
                    setIsLoading(false);
                };
                document.head.appendChild(script);

                // Load CSS
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/bpmn-js@latest/dist/assets/diagram-js.css';
                document.head.appendChild(link);

                const bpmnCss = document.createElement('link');
                bpmnCss.rel = 'stylesheet';
                bpmnCss.href = 'https://unpkg.com/bpmn-js@latest/dist/assets/bpmn-font/css/bpmn-embedded.css';
                document.head.appendChild(bpmnCss);

            } catch (err) {
                console.error('Error loading bpmn-js:', err);
                setError('Failed to load BPMN viewer');
                setIsLoading(false);
            }
        };

        loadBpmnJs();
    }, []);

    const initializeViewer = () => {
        try {
            if (!containerRef.current || !window.BpmnJS) return;

            const bpmnViewer = new window.BpmnJS({
                container: containerRef.current,
                width: '100%',
                height: '100%'
            });

            // Add event listeners
            bpmnViewer.on('element.click', (event: any) => {
                if (onElementClick) {
                    onElementClick(event.element);
                }
            });

            if (editable && onModelChange) {
                bpmnViewer.on('commandStack.changed', async () => {
                    try {
                        const result = await bpmnViewer.saveXML({ format: true });
                        onModelChange(result.xml);
                    } catch (err) {
                        console.error('Error saving XML:', err);
                    }
                });
            }

            setViewer(bpmnViewer);
            setIsLoaded(true);
            setIsLoading(false);
        } catch (err) {
            console.error('Error initializing BPMN viewer:', err);
            setError('Failed to initialize BPMN viewer');
            setIsLoading(false);
        }
    };

    // Load BPMN XML when viewer is ready or XML changes
    useEffect(() => {
        if (!viewer || !bpmnXml || !isLoaded) return;

        const loadDiagram = async () => {
            try {
                setIsLoading(true);
                setError(null);

                await viewer.importXML(bpmnXml);

                // Fit viewport to show the entire diagram
                const canvas = viewer.get('canvas');
                canvas.zoom('fit-viewport', 'auto');

                setIsLoading(false);
            } catch (err) {
                console.error('Error loading BPMN diagram:', err);
                setError(`Failed to load BPMN diagram: ${err instanceof Error ? err.message : 'Unknown error'}`);
                setIsLoading(false);
            }
        };

        loadDiagram();
    }, [viewer, bpmnXml, isLoaded]);

    const downloadBpmn = async () => {
        if (!viewer) return;

        try {
            const result = await viewer.saveXML({ format: true });
            const blob = new Blob([result.xml], { type: 'application/xml' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `process_${Date.now()}.bpmn`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error downloading BPMN:', err);
        }
    };

    const zoomIn = () => {
        if (!viewer) return;
        const canvas = viewer.get('canvas');
        canvas.zoom(canvas.zoom() * 1.2);
    };

    const zoomOut = () => {
        if (!viewer) return;
        const canvas = viewer.get('canvas');
        canvas.zoom(canvas.zoom() * 0.8);
    };

    const resetZoom = () => {
        if (!viewer) return;
        const canvas = viewer.get('canvas');
        canvas.zoom('fit-viewport', 'auto');
    };

    if (error) {
        return (
            <div className="bpmn-viewer-error">
                <div className="error-content">
                    <h3>⚠️ Error Loading BPMN Viewer</h3>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>
                        Reload Page
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bpmn-viewer-container">
            <div className="bpmn-viewer-toolbar">
                <div className="toolbar-group">
                    <button
                        className="toolbar-button"
                        onClick={zoomIn}
                        disabled={!viewer}
                        title="Zoom In"
                    >
                        🔍+
                    </button>
                    <button
                        className="toolbar-button"
                        onClick={zoomOut}
                        disabled={!viewer}
                        title="Zoom Out"
                    >
                        🔍-
                    </button>
                    <button
                        className="toolbar-button"
                        onClick={resetZoom}
                        disabled={!viewer}
                        title="Fit to Viewport"
                    >
                        📐
                    </button>
                </div>

                <div className="toolbar-group">
                    <button
                        className="toolbar-button"
                        onClick={downloadBpmn}
                        disabled={!viewer || !bpmnXml}
                        title="Download BPMN"
                    >
                        💾 Download
                    </button>
                </div>
            </div>

            <div className="bpmn-viewer-content">
                {isLoading && (
                    <div className="loading-overlay">
                        <div className="loading-spinner"></div>
                        <p>Loading BPMN diagram...</p>
                    </div>
                )}

                <div
                    ref={containerRef}
                    className="bpmn-container"
                    style={{
                        visibility: isLoading ? 'hidden' : 'visible',
                        height: '100%',
                        width: '100%'
                    }}
                />

                {!bpmnXml && !isLoading && (
                    <div className="empty-state">
                        <div className="empty-content">
                            <h3>No BPMN Model</h3>
                            <p>Start a conversation with the AI assistant to generate a BPMN process model.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BPMNViewer;
