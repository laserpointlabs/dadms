import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import './BPMNViewer.css';

interface BPMNViewerProps {
    bpmnXml: string | null;
    onModelChange?: (xml: string) => void;
    isEditable?: boolean;
    className?: string;
}

// Declare bpmn-js types
declare global {
    interface Window {
        BpmnJS: any;
    }
}

const BPMNViewer = forwardRef<{
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
    fitViewport: () => void;
    getElementCount: () => number;
    getModeler: () => any;
}, BPMNViewerProps>(({
    bpmnXml,
    onModelChange,
    isEditable = false,
    className = ''
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const bpmnViewerRef = useRef<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentXml, setCurrentXml] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const changeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize and display BPMN diagram when XML is available
    useEffect(() => {
        if (!bpmnXml || !containerRef.current) {
            setIsLoading(false);
            return;
        }

        // Prevent re-initialization if the XML content hasn't changed
        if (currentXml === bpmnXml) {
            console.log('BPMN XML unchanged - skipping re-initialization');
            return;
        }

        setCurrentXml(bpmnXml);

        const initializeViewer = async () => {
            try {
                setIsLoading(true);

                // Load CSS files if not already loaded
                if (!document.querySelector('link[href*="bpmn-js"]')) {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = `https://unpkg.com/bpmn-js@18.6.2/dist/assets/diagram-js.css?t=${Date.now()}`;
                    document.head.appendChild(link);

                    const link2 = document.createElement('link');
                    link2.rel = 'stylesheet';
                    link2.href = `https://unpkg.com/bpmn-js@18.6.2/dist/assets/bpmn-font/css/bpmn.css?t=${Date.now()}`;
                    document.head.appendChild(link2);
                }

                // Load BPMN.js library if not already loaded
                let BpmnModeler;

                console.log('Checking if window.BpmnJS exists:', !!window.BpmnJS);

                if (!window.BpmnJS) {
                    console.log('Loading bpmn-js from CDN...');
                    // Load the main bpmn-js bundle which includes BpmnModeler
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = `https://unpkg.com/bpmn-js@18.6.2/dist/bpmn-modeler.production.min.js?t=${Date.now()}`;
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

                // Try different ways to access the BPMN modeler class
                BpmnModeler = window.BpmnJS?.BpmnModeler || window.BpmnJS;
                console.log('BpmnModeler class:', BpmnModeler);

                if (!BpmnModeler) {
                    throw new Error('Failed to load BPMN Modeler from CDN');
                }

                // Create BPMN modeler instance with standard configuration
                console.log('Creating BpmnModeler instance...');
                const modeler = new BpmnModeler({
                    container: containerRef.current,
                    width: '100%',
                    height: '100%'
                });

                bpmnViewerRef.current = modeler;
                setIsInitialized(true);

                // Set up event handlers following official pattern
                modeler.on('import.done', (event: any) => {
                    const { error: importError, warnings } = event;

                    if (importError) {
                        console.error('Failed to import BPMN diagram:', importError);
                        setIsLoading(false);
                        return;
                    }

                    // Zoom to fit following official pattern
                    try {
                        const canvas = modeler.get('canvas');
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

                // Add change listener for editable mode
                if (isEditable && onModelChange) {
                    let debounceTimer: NodeJS.Timeout;
                    modeler.on('commandStack.changed', async () => {
                        // Debounce the change callback to prevent too many rapid updates
                        clearTimeout(debounceTimer);
                        debounceTimer = setTimeout(async () => {
                            try {
                                const result = await modeler.saveXML({ format: true });
                                onModelChange(result.xml);
                            } catch (err) {
                                console.error('Error saving XML:', err);
                            }
                        }, 300); // 300ms debounce
                    });
                }

                // Import the XML following official pattern
                console.log('Importing BPMN XML into viewer...');
                console.log('Container element:', containerRef.current);
                console.log('Viewer instance:', modeler);
                modeler.importXML(bpmnXml);

            } catch (err: any) {
                console.error('Error initializing BPMN viewer:', err);
                setIsLoading(false);
            }
        };

        initializeViewer();

        // Cleanup function following official pattern
        return () => {
            if (bpmnViewerRef.current) {
                bpmnViewerRef.current.destroy();
                bpmnViewerRef.current = null;
                setIsInitialized(false);
            }
        };
    }, [bpmnXml]);

    // Handle isEditable prop changes separately without re-initializing
    useEffect(() => {
        if (!bpmnViewerRef.current || !isInitialized) return;

        console.log('isEditable changed to:', isEditable);

        // Add or remove change listener based on isEditable
        if (isEditable && onModelChange) {
            // Add change listener if not already present
            const modeler = bpmnViewerRef.current;
            if (!modeler._hasChangeListener) {
                let debounceTimer: NodeJS.Timeout;
                modeler.on('commandStack.changed', async () => {
                    clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(async () => {
                        try {
                            const result = await modeler.saveXML({ format: true });
                            onModelChange(result.xml);
                        } catch (err) {
                            console.error('Error saving XML:', err);
                        }
                    }, 300);
                });
                modeler._hasChangeListener = true;
            }
        }
    }, [isEditable, onModelChange, isInitialized]);

    const zoomIn = () => {
        if (bpmnViewerRef.current) {
            const canvas = bpmnViewerRef.current.get('canvas');
            canvas.zoom(canvas.zoom() + 0.1);
        }
    };

    const zoomOut = () => {
        if (bpmnViewerRef.current) {
            const canvas = bpmnViewerRef.current.get('canvas');
            canvas.zoom(canvas.zoom() - 0.1);
        }
    };

    const resetZoom = () => {
        if (bpmnViewerRef.current) {
            const canvas = bpmnViewerRef.current.get('canvas');
            canvas.zoom('fit-viewport');
        }
    };

    const fitViewport = () => {
        if (bpmnViewerRef.current) {
            const canvas = bpmnViewerRef.current.get('canvas');
            canvas.zoom('fit-viewport');
        }
    };

    const getElementCount = () => {
        if (!bpmnViewerRef.current) return 0;
        const elementRegistry = bpmnViewerRef.current.get('elementRegistry');
        return elementRegistry.getAll().length;
    };

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
        zoomIn,
        zoomOut,
        resetZoom,
        fitViewport,
        getElementCount,
        getModeler: () => bpmnViewerRef.current
    }));

    return (
        <div className="bpmn-viewer-container">
            <div className="bpmn-viewer-content">
                {isLoading && (
                    <div className="loading-overlay">
                        <div className="loading-spinner"></div>
                        <p>Loading BPMN diagram...</p>
                    </div>
                )}

                {/* Debug info for edit mode */}
                {isEditable && (
                    <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: '#28a745',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        zIndex: 1001
                    }}>
                        ✏️ Edit Mode
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
});

export default BPMNViewer;
