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

    // Debug: Log props received
    useEffect(() => {
        console.log('BPMNViewer props changed:', {
            bpmnXmlLength: bpmnXml?.length || 0,
            bpmnXmlPreview: bpmnXml?.substring(0, 100) || 'null/empty',
            editable,
            hasOnElementClick: !!onElementClick,
            hasOnModelChange: !!onModelChange
        });
    }, [bpmnXml, editable, onElementClick, onModelChange]);

    // Load bpmn-js dynamically
    useEffect(() => {
        const loadBpmnJs = async () => {
            try {
                // Check if bpmn-js is already loaded
                if (window.BpmnJS) {
                    console.log('bpmn-js already loaded');
                    initializeViewer();
                    return;
                }

                console.log('Loading bpmn-js from CDN...');

                // Load CSS files first
                if (!document.querySelector('link[href*="diagram-js.css"]')) {
                    const diagramCss = document.createElement('link');
                    diagramCss.rel = 'stylesheet';
                    diagramCss.href = 'https://unpkg.com/bpmn-js@18.6.2/dist/assets/diagram-js.css';
                    document.head.appendChild(diagramCss);
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                if (!document.querySelector('link[href*="bpmn.css"]')) {
                    const bpmnCss = document.createElement('link');
                    bpmnCss.rel = 'stylesheet';
                    bpmnCss.href = 'https://unpkg.com/bpmn-js@18.6.2/dist/assets/bpmn-font/css/bpmn.css';
                    document.head.appendChild(bpmnCss);
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                // Load bpmn-js from CDN with specific version
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://unpkg.com/bpmn-js@18.6.2/dist/bpmn-viewer.production.min.js';
                    script.onload = () => {
                        console.log('bpmn-js loaded successfully');
                        console.log('window.BpmnJS:', window.BpmnJS);
                        resolve(void 0);
                    };
                    script.onerror = (error) => {
                        console.error('Failed to load bpmn-js:', error);
                        reject(error);
                    };
                    document.head.appendChild(script);
                });

                initializeViewer();

            } catch (err) {
                console.error('Error loading bpmn-js:', err);
                setError('Failed to load BPMN viewer library');
                setIsLoading(false);
            }
        };

        loadBpmnJs();
    }, []);

    const initializeViewer = () => {
        try {
            if (!containerRef.current || !window.BpmnJS) {
                console.error('Container or BpmnJS not available');
                return;
            }

            console.log('Initializing BPMN viewer...');
            console.log('Container:', containerRef.current);
            console.log('window.BpmnJS:', window.BpmnJS);

            // Try different ways to access the viewer class
            const ViewerClass = window.BpmnJS?.Viewer || window.BpmnJS;
            if (!ViewerClass) {
                throw new Error('BPMN viewer class not found');
            }

            const bpmnViewer = new ViewerClass({
                container: containerRef.current,
                width: '100%',
                height: '100%'
            });

            console.log('BPMN viewer created:', bpmnViewer);
            console.log('Container element:', containerRef.current);
            console.log('Container dimensions:', {
                width: containerRef.current?.offsetWidth,
                height: containerRef.current?.offsetHeight,
                clientWidth: containerRef.current?.clientWidth,
                clientHeight: containerRef.current?.clientHeight
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
            console.log('BPMN viewer initialized successfully');
        } catch (err) {
            console.error('Error initializing BPMN viewer:', err);
            setError('Failed to initialize BPMN viewer');
            setIsLoading(false);
        }
    };

    // Load BPMN XML when viewer is ready or XML changes
    useEffect(() => {
        console.log('BPMN XML useEffect triggered:', {
            hasViewer: !!viewer,
            isLoaded,
            bpmnXmlLength: bpmnXml?.length || 0,
            bpmnXmlPreview: bpmnXml?.substring(0, 100) || 'empty'
        });

        if (!viewer || !isLoaded) {
            console.log('Viewer not ready yet:', { viewer: !!viewer, isLoaded });
            return;
        }

        // If there's no BPMN XML, just clear any existing diagram
        if (!bpmnXml || bpmnXml.trim() === '') {
            console.log('No BPMN XML provided, clearing diagram');
            setIsLoading(false);
            setError(null);
            return;
        }

        const loadDiagram = async () => {
            try {
                setIsLoading(true);
                setError(null);

                console.log('Loading BPMN XML:', bpmnXml.substring(0, 200) + '...');
                console.log('Viewer instance:', viewer);
                console.log('XML length:', bpmnXml.length);
                console.log('XML starts with:', bpmnXml.substring(0, 100));

                // Basic XML validation
                try {
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(bpmnXml, 'text/xml');
                    const parseError = xmlDoc.querySelector('parsererror');
                    if (parseError) {
                        throw new Error(`XML parsing error: ${parseError.textContent}`);
                    }
                    console.log('XML validation passed');
                } catch (validationError) {
                    console.error('XML validation failed:', validationError);
                    throw validationError;
                }

                const result = await viewer.importXML(bpmnXml);
                console.log('Import result:', result);

                if (result.warnings && result.warnings.length > 0) {
                    console.warn('BPMN import warnings:', result.warnings);
                }

                // Check if SVG was actually created
                const svgElement = containerRef.current?.querySelector('svg');
                console.log('SVG element after import:', svgElement);
                console.log('Container HTML after import:', containerRef.current?.innerHTML?.substring(0, 200));

                // Fit viewport to show the entire diagram
                const canvas = viewer.get('canvas');
                console.log('Canvas instance:', canvas);

                // Try to get viewport info
                try {
                    const viewbox = canvas.viewbox();
                    console.log('Canvas viewbox:', viewbox);
                } catch (viewboxError) {
                    console.warn('Could not get viewbox:', viewboxError);
                }

                canvas.zoom('fit-viewport', 'auto');

                setIsLoading(false);
                console.log('BPMN diagram loaded successfully');
            } catch (err) {
                console.error('Error loading BPMN diagram:', err);
                console.error('Error details:', {
                    message: err instanceof Error ? err.message : 'Unknown error',
                    stack: err instanceof Error ? err.stack : undefined,
                    bpmnXmlLength: bpmnXml.length,
                    viewerExists: !!viewer
                });
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
