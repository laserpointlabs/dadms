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
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = `https://unpkg.com/bpmn-js@18.6.2/dist/bpmn-modeler.production.min.js?t=${Date.now()}`;
                    script.onload = () => resolve(void 0);
                    script.onerror = (error) => reject(error);
                    document.head.appendChild(script);
                });
            }
            BpmnModeler = window.BpmnJS?.BpmnModeler || window.BpmnJS;
            if (!BpmnModeler) throw new Error('Failed to load BPMN Modeler from CDN');
            // Only create if not already created
            if (!bpmnViewerRef.current) {
                modeler = new BpmnModeler({
                    container: containerRef.current,
                    width: '100%',
                    height: '100%'
                });
                bpmnViewerRef.current = modeler;
                setIsInitialized(true);

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
                        if (element && element.type !== 'bpmn:Process' && element.type !== 'bpmn:SubProcess') {
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
                            if (element.type !== 'bpmn:Process' && element.type !== 'bpmn:SubProcess') {
                                const elementInfo = {
                                    id: element.id,
                                    type: element.type,
                                    name: element.businessObject?.name,
                                    businessObject: element.businessObject
                                };
                                onElementSelect(elementInfo);
                            }
                        } else {
                            onElementSelect(null);
                        }
                    });
                }
            }
        };
        setupModeler();
        return () => {
            isMounted = false;
            if (bpmnViewerRef.current) {
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
