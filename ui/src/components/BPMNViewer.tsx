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
    const bpmnViewerRef = useRef<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize and display BPMN diagram when XML is available - EXACTLY like the working implementation
    useEffect(() => {
        if (!bpmnXml || !containerRef.current) {
            return;
        }

        const initializeViewer = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Load CSS files if not already loaded - EXACT SAME AS WORKING VERSION
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

                // Load bpmn-js library - EXACT SAME AS WORKING VERSION
                let NavigatedViewer;

                console.log('Checking if window.BpmnJS exists:', !!window.BpmnJS);

                if (!window.BpmnJS) {
                    console.log('Loading bpmn-js from CDN...');
                    // Load the main bpmn-js bundle which includes NavigatedViewer
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = `https://unpkg.com/bpmn-js@18.6.2/dist/bpmn-viewer.production.min.js?t=${Date.now()}`;
                        script.onload = () => {
                            console.log('bpmn-js loaded from CDN successfully');
                            console.log('window.BpmnJS:', window.BpmnJS);
                            resolve(void 0);
                        };
                        script.onerror = (error) => {
                            console.error('Failed to load bpmn-js from CDN:', error);
                            reject(error);
                        };
                        document.head.appendChild(script);
                    });
                }

                // Try different ways to access the BPMN viewer class - EXACT SAME AS WORKING VERSION
                NavigatedViewer = window.BpmnJS?.NavigatedViewer || window.BpmnJS;
                console.log('NavigatedViewer class:', NavigatedViewer);

                if (!NavigatedViewer) {
                    throw new Error('Failed to load BPMN NavigatedViewer from CDN');
                }

                // Create BPMN viewer instance - EXACT SAME AS WORKING VERSION
                console.log('Creating NavigatedViewer instance...');
                const viewer = new NavigatedViewer({
                    container: containerRef.current,
                    width: '100%',
                    height: '600px'
                });

                bpmnViewerRef.current = viewer;

                // Set up event handlers following official pattern - EXACT SAME AS WORKING VERSION
                viewer.on('import.done', (event: any) => {
                    const { error: importError, warnings } = event;

                    if (importError) {
                        console.error('Failed to import BPMN diagram:', importError);
                        setError(`Failed to import BPMN diagram: ${importError.message}`);
                        setIsLoading(false);
                        return;
                    }

                    // Zoom to fit following official pattern - EXACT SAME AS WORKING VERSION
                    try {
                        const canvas = viewer.get('canvas');
                        console.log('Canvas object:', canvas);
                        console.log('Canvas viewbox before zoom:', canvas.viewbox());

                        canvas.zoom('fit-viewport');

                        console.log('Canvas viewbox after zoom:', canvas.viewbox());
                        console.log('Canvas zoom level:', canvas.zoom());
                    } catch (zoomError) {
                        console.warn('Could not zoom to fit viewport:', zoomError);
                    }

                    if (warnings && warnings.length > 0) {
                        console.warn('BPMN import warnings:', warnings);
                    }

                    setIsLoading(false);
                    console.log('BPMN diagram loaded successfully');

                    // Check if SVG elements were created
                    const svgElements = containerRef.current?.querySelectorAll('svg');
                    console.log('SVG elements in container:', svgElements?.length);
                    if (svgElements && svgElements.length > 0) {
                        console.log('First SVG element:', svgElements[0]);
                        console.log('SVG dimensions:', svgElements[0].getBBox?.());
                    }
                });

                // Add element click listener if provided
                if (onElementClick) {
                    viewer.on('element.click', (event: any) => {
                        onElementClick(event.element);
                    });
                }

                // Add change listener for editable mode
                if (editable && onModelChange) {
                    viewer.on('commandStack.changed', async () => {
                        try {
                            const result = await viewer.saveXML({ format: true });
                            onModelChange(result.xml);
                        } catch (err) {
                            console.error('Error saving XML:', err);
                        }
                    });
                }

                // Import the XML following official pattern - EXACT SAME AS WORKING VERSION
                console.log('Importing BPMN XML into viewer...');
                console.log('Container element:', containerRef.current);
                console.log('Viewer instance:', viewer);
                viewer.importXML(bpmnXml);

            } catch (err: any) {
                console.error('Error initializing BPMN viewer:', err);
                setError(err.message || 'Failed to initialize BPMN viewer');
                setIsLoading(false);
            }
        };

        initializeViewer();

        // Cleanup function following official pattern - EXACT SAME AS WORKING VERSION
        return () => {
            if (bpmnViewerRef.current) {
                bpmnViewerRef.current.destroy();
                bpmnViewerRef.current = null;
            }
        };
    }, [bpmnXml, onElementClick, onModelChange, editable]);

    const downloadBpmn = async () => {
        if (!bpmnViewerRef.current) return;

        try {
            const result = await bpmnViewerRef.current.saveXML({ format: true });
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
        if (!bpmnViewerRef.current) return;
        const canvas = bpmnViewerRef.current.get('canvas');
        canvas.zoom(canvas.zoom() * 1.2);
    };

    const zoomOut = () => {
        if (!bpmnViewerRef.current) return;
        const canvas = bpmnViewerRef.current.get('canvas');
        canvas.zoom(canvas.zoom() * 0.8);
    };

    const resetZoom = () => {
        if (!bpmnViewerRef.current) return;
        const canvas = bpmnViewerRef.current.get('canvas');
        canvas.zoom('fit-viewport', 'auto');
    };

    const fitAndCenter = () => {
        if (!bpmnViewerRef.current) return;

        try {
            console.log('Fit & Center clicked - applying comprehensive fixes...');

            const canvas = bpmnViewerRef.current.get('canvas');
            const elementRegistry = bpmnViewerRef.current.get('elementRegistry');

            // Get all elements to find diagram bounds
            const elements = elementRegistry.getAll();
            console.log('Found elements:', elements.length);

            if (elements.length === 0) {
                console.log('No elements found to center');
                return;
            }

            // Calculate diagram bounds
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

            elements.forEach((element: any) => {
                if (element.x !== undefined && element.y !== undefined) {
                    minX = Math.min(minX, element.x);
                    minY = Math.min(minY, element.y);
                    maxX = Math.max(maxX, element.x + (element.width || 0));
                    maxY = Math.max(maxY, element.y + (element.height || 0));
                }
            });

            console.log('Diagram bounds:', { minX, minY, maxX, maxY });

            // Reset viewbox and zoom
            canvas.zoom('fit-viewport');

            // Force center the viewport
            const diagramCenter = {
                x: (minX + maxX) / 2,
                y: (minY + maxY) / 2
            };

            console.log('Centering on:', diagramCenter);

            // Get canvas dimensions
            const container = canvas._container;
            const containerRect = container.getBoundingClientRect();
            const containerCenter = {
                x: containerRect.width / 2,
                y: containerRect.height / 2
            };

            console.log('Container center:', containerCenter);

            // Calculate offset needed to center diagram
            const offset = {
                x: containerCenter.x - diagramCenter.x,
                y: containerCenter.y - diagramCenter.y
            };

            console.log('Applying offset:', offset);

            // Apply the centering
            canvas.scroll(offset);

        } catch (error) {
            console.error('Error in fitAndCenter:', error);
            // Fallback to simple zoom fit
            const canvas = bpmnViewerRef.current.get('canvas');
            canvas.zoom('fit-viewport');
        }
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
                        disabled={!bpmnViewerRef.current}
                        title="Zoom In"
                    >
                        🔍+
                    </button>
                    <button
                        className="toolbar-button"
                        onClick={zoomOut}
                        disabled={!bpmnViewerRef.current}
                        title="Zoom Out"
                    >
                        🔍-
                    </button>
                    <button
                        className="toolbar-button"
                        onClick={resetZoom}
                        disabled={!bpmnViewerRef.current}
                        title="Fit to Viewport"
                    >
                        📐
                    </button>
                    <button
                        className="toolbar-button"
                        onClick={fitAndCenter}
                        disabled={!bpmnViewerRef.current}
                        title="Fit & Center Diagram"
                    >
                        🎯 Center
                    </button>
                </div>

                <div className="toolbar-group">
                    <button
                        className="toolbar-button"
                        onClick={downloadBpmn}
                        disabled={!bpmnViewerRef.current || !bpmnXml}
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
