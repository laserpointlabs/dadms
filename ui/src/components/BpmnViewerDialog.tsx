import { Close } from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';

interface BpmnViewerDialogProps {
    open: boolean;
    onClose: () => void;
    processDefinition: {
        id: string;
        name: string;
    } | null;
}

const BpmnViewerDialog: React.FC<BpmnViewerDialogProps> = ({
    open,
    onClose,
    processDefinition
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const bpmnViewerRef = useRef<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [diagramXML, setDiagramXML] = useState<string | null>(null);

    // Load BPMN XML when dialog opens and processDefinition changes
    useEffect(() => {
        if (!open || !processDefinition) {
            setDiagramXML(null);
            return;
        }

        const fetchDiagramXML = async () => {
            setLoading(true);
            setError(null);

            try {
                let response;
                try {
                    // Try proxy first
                    response = await fetch(`/api/process/definitions/${processDefinition.id}/xml`);
                } catch (proxyError) {
                    console.warn('Proxy request failed, trying direct backend:', proxyError);
                    // Fallback to direct backend URL using host.docker.internal for Docker
                    const fallbackUrl = window.location.hostname === 'localhost'
                        ? `http://localhost:8000/api/process/definitions/${processDefinition.id}/xml`
                        : `http://host.docker.internal:8000/api/process/definitions/${processDefinition.id}/xml`;
                    console.log('Trying fallback URL:', fallbackUrl);
                    response = await fetch(fallbackUrl);
                }

                if (!response.ok) {
                    throw new Error(`Failed to fetch BPMN XML: ${response.status} ${response.statusText}`);
                }

                const xml = await response.text();
                console.log('BPMN XML loaded successfully, length:', xml.length);
                console.log('XML preview:', xml.substring(0, 200) + '...');
                setDiagramXML(xml);
            } catch (err: any) {
                console.error('Error fetching BPMN XML:', err);
                setError(err.message || 'Failed to fetch BPMN diagram');
                setLoading(false);
            }
        };

        fetchDiagramXML();
    }, [open, processDefinition]);

    // Initialize and display BPMN diagram when XML is loaded
    useEffect(() => {
        if (!diagramXML || !containerRef.current || !open) {
            return;
        }

        const initializeViewer = async () => {
            try {
                setLoading(true);
                setError(null);

                // Load CSS files if not already loaded
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

                // Load bpmn-js library - use the correct CDN URL for NavigatedViewer
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
                            console.log('Available on window:', Object.keys(window).filter(k => k.includes('Bpmn')));
                            resolve(void 0);
                        };
                        script.onerror = (error) => {
                            console.error('Failed to load bpmn-js from CDN:', error);
                            reject(error);
                        };
                        document.head.appendChild(script);
                    });
                }

                // Try different ways to access the BPMN viewer class
                NavigatedViewer = window.BpmnJS?.NavigatedViewer || window.BpmnJS;
                console.log('NavigatedViewer class:', NavigatedViewer);

                if (!NavigatedViewer) {
                    throw new Error('Failed to load BPMN NavigatedViewer from CDN');
                }

                // Create BPMN viewer instance
                console.log('Creating NavigatedViewer instance...');
                const viewer = new NavigatedViewer({
                    container: containerRef.current,
                    width: '100%',
                    height: '600px'
                });

                bpmnViewerRef.current = viewer;

                // Set up event handlers following official pattern
                viewer.on('import.done', (event: any) => {
                    const { error: importError, warnings } = event;

                    if (importError) {
                        console.error('Failed to import BPMN diagram:', importError);
                        setError(`Failed to import BPMN diagram: ${importError.message}`);
                        setLoading(false);
                        return;
                    }

                    // Zoom to fit following official pattern
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

                    setLoading(false);
                    console.log('BPMN diagram loaded successfully');

                    // Check if SVG elements were created
                    const svgElements = containerRef.current?.querySelectorAll('svg');
                    console.log('SVG elements in container:', svgElements?.length);
                    if (svgElements && svgElements.length > 0) {
                        console.log('First SVG element:', svgElements[0]);
                        console.log('SVG dimensions:', svgElements[0].getBBox());
                    }
                });

                // Import the XML following official pattern
                console.log('Importing BPMN XML into viewer...');
                console.log('Container element:', containerRef.current);
                console.log('Viewer instance:', viewer);
                viewer.importXML(diagramXML);

            } catch (err: any) {
                console.error('Error initializing BPMN viewer:', err);
                setError(err.message || 'Failed to initialize BPMN viewer');
                setLoading(false);
            }
        };

        initializeViewer();

        // Cleanup function following official pattern
        return () => {
            if (bpmnViewerRef.current) {
                bpmnViewerRef.current.destroy();
                bpmnViewerRef.current = null;
            }
        };
    }, [diagramXML, open]);

    const handleClose = () => {
        if (bpmnViewerRef.current) {
            bpmnViewerRef.current.destroy();
            bpmnViewerRef.current = null;
        }
        setError(null);
        setLoading(false);
        setDiagramXML(null);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: { height: '80vh' }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Process Model: {processDefinition?.name || 'Unknown'}
                <IconButton onClick={handleClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0, position: 'relative' }}>
                {loading && (
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '400px'
                    }}>
                        <CircularProgress />
                    </Box>
                )}
                {error && (
                    <Box sx={{ p: 2 }}>
                        <Alert severity="error">{error}</Alert>
                    </Box>
                )}
                <div
                    ref={containerRef}
                    style={{
                        width: '100%',
                        height: loading || error ? '0px' : '600px',
                        minHeight: loading || error ? '0px' : '600px'
                    }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

declare global {
    interface Window {
        BpmnJS: any;
    }
}

export default BpmnViewerDialog;
