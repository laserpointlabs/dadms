import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import './BPMNViewer.css';

interface BPMNViewerProps {
    bpmnXml: string | null;
    onModelChange?: (xml: string) => void;
    isEditable?: boolean;
    className?: string;
    onElementSelect?: (element: any) => void;
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
    className = '',
    onElementSelect
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const bpmnViewerRef = useRef<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentXml, setCurrentXml] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const changeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastImportedXmlRef = useRef<string | null>(null);

    // Create the modeler instance only once
    useEffect(() => {
        let modeler: any;
        let isMounted = true;
        const setupModeler = async () => {
            try {
                console.log('BPMNViewer: Starting modeler setup...');

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
                if (!window.BpmnJS) {
                    console.log('BPMNViewer: Loading BPMN.js library...');
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = `https://unpkg.com/bpmn-js@18.6.2/dist/bpmn-modeler.production.min.js?t=${Date.now()}`;
                        script.onload = () => {
                            console.log('BPMNViewer: BPMN.js library loaded successfully');
                            resolve(void 0);
                        };
                        script.onerror = (error) => {
                            console.error('BPMNViewer: Failed to load BPMN.js library:', error);
                            reject(error);
                        };
                        document.head.appendChild(script);
                    });
                }

                BpmnModeler = window.BpmnJS?.BpmnModeler || window.BpmnJS;
                if (!BpmnModeler) {
                    throw new Error('Failed to load BPMN Modeler from CDN');
                }

                console.log('BPMNViewer: BpmnModeler constructor available:', !!BpmnModeler);

                // Only create if not already created
                if (!bpmnViewerRef.current && containerRef.current) {
                    console.log('BPMNViewer: Creating new modeler instance...');

                    // Simple modeler configuration - keep it working
                    modeler = new BpmnModeler({
                        container: containerRef.current,
                        width: '100%',
                        height: '100%'
                    });

                    console.log('BPMNViewer: Modeler instance created:', !!modeler);
                    bpmnViewerRef.current = modeler;
                    setIsInitialized(true);
                    console.log('BPMNViewer: Modeler initialization complete');

                    // Add change listener for editable mode
                    if (isEditable && onModelChange) {
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
                    }

                    // Add element selection listener
                    if (onElementSelect) {
                        modeler.on('element.click', (event: any) => {
                            const element = event.element;
                            if (element) {
                                const elementInfo = {
                                    id: element.id,
                                    type: element.type,
                                    name: element.businessObject?.name,
                                    businessObject: element.businessObject
                                };
                                onElementSelect(elementInfo);
                            }
                        });

                        // Also listen for selection changes
                        modeler.on('selection.changed', (event: any) => {
                            const selection = event.newSelection;
                            if (selection && selection.length > 0) {
                                const element = selection[0];
                                const elementInfo = {
                                    id: element.id,
                                    type: element.type,
                                    name: element.businessObject?.name,
                                    businessObject: element.businessObject
                                };
                                onElementSelect(elementInfo);
                            } else {
                                onElementSelect(null);
                            }
                        });

                        // Listen for canvas clicks to select the process
                        modeler.on('canvas.click', (event: any) => {
                            // Only select process if no element was clicked
                            if (!event.element) {
                                const elementRegistry = modeler.get('elementRegistry');
                                const process = elementRegistry.get('Process_1') || elementRegistry.get('TestProcess');
                                if (process) {
                                    const elementInfo = {
                                        id: process.id,
                                        type: process.type,
                                        name: process.businessObject?.name,
                                        businessObject: process.businessObject
                                    };
                                    onElementSelect(elementInfo);
                                }
                            }
                        });
                    }
                } else {
                    console.log('BPMNViewer: Modeler already exists or container not ready');
                }
            } catch (error) {
                console.error('BPMNViewer: Error in setupModeler:', error);
                setIsInitialized(false);
            }
        };

        setupModeler();

        return () => {
            isMounted = false;
            if (bpmnViewerRef.current) {
                console.log('BPMNViewer: Cleaning up modeler...');
                bpmnViewerRef.current.destroy();
                bpmnViewerRef.current = null;
                setIsInitialized(false);
            }
        };
    }, []); // Only run on mount/unmount

    // Only import XML when bpmnXml changes
    useEffect(() => {
        console.log('BPMNViewer: bpmnXml changed, length:', bpmnXml?.length || 0);
        console.log('BPMNViewer: containerRef.current:', !!containerRef.current);
        console.log('BPMNViewer: bpmnViewerRef.current:', !!bpmnViewerRef.current);
        console.log('BPMNViewer: isInitialized:', isInitialized);

        if (!bpmnXml || !containerRef.current) {
            console.log('BPMNViewer: Skipping import - missing XML or container');
            setIsLoading(false);
            return;
        }

        if (lastImportedXmlRef.current === bpmnXml) {
            console.log('BPMNViewer: Skipping import - XML unchanged');
            return;
        }

        // Wait for modeler to be fully initialized with retry limit
        let retryCount = 0;
        const maxRetries = 50; // 5 seconds max wait

        const importXml = async () => {
            if (!bpmnViewerRef.current || !isInitialized) {
                retryCount++;
                if (retryCount >= maxRetries) {
                    console.error('BPMNViewer: Modeler failed to initialize after', maxRetries, 'retries');
                    setIsLoading(false);
                    return;
                }
                console.log('BPMNViewer: Modeler not ready, retry', retryCount, 'of', maxRetries);
                setTimeout(importXml, 100);
                return;
            }

            console.log('BPMNViewer: Modeler ready, importing XML...');
            setIsLoading(true);
            try {
                await bpmnViewerRef.current.importXML(bpmnXml);
                console.log('BPMNViewer: XML imported successfully');
                lastImportedXmlRef.current = bpmnXml;
                setIsLoading(false);
            } catch (err: any) {
                console.error('BPMNViewer: Error importing BPMN XML:', err);
                setIsLoading(false);
            }
        };

        importXml();
    }, [bpmnXml, isInitialized]);

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
