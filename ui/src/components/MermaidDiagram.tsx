import { Alert, Box } from '@mui/material';
import mermaid from 'mermaid';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface MermaidDiagramProps {
    chart: string;
    id?: string;
}

// Initialize mermaid once globally
mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'strict',
    fontFamily: 'arial, sans-serif',
    fontSize: 16,
    maxTextSize: 50000,
});

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart, id }) => {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [svgContent, setSvgContent] = useState<string>('');
    const chartId = useRef(id || `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    const isMountedRef = useRef(true);

    const renderMermaid = useCallback(async () => {
        if (!chart.trim()) {
            setError('Empty chart definition');
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Generate a new unique ID for each render
            const uniqueId = `${chartId.current}-${Date.now()}`;

            // Render the diagram
            const { svg } = await mermaid.render(uniqueId, chart);

            if (isMountedRef.current && svg) {
                setSvgContent(svg);
            }
        } catch (err) {
            console.warn('Mermaid rendering error:', err);
            if (isMountedRef.current) {
                setError(err instanceof Error ? err.message : 'Failed to render diagram');
            }
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
    }, [chart]);

    useEffect(() => {
        isMountedRef.current = true;
        renderMermaid();

        return () => {
            isMountedRef.current = false;
        };
    }, [renderMermaid]);

    if (error) {
        return (
            <Alert severity="warning" sx={{ my: 1 }}>
                Failed to render Mermaid diagram: {error}
            </Alert>
        );
    }

    return (
        <Box
            sx={{
                my: 1,
                p: 1,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                backgroundColor: 'background.paper',
                textAlign: 'center',
                minHeight: '60px',
                width: '100%',
                overflow: 'visible',
                display: 'block',
                '& svg': {
                    maxWidth: '100% !important',
                    height: 'auto !important',
                    display: 'block !important',
                    margin: '0 auto !important',
                    visibility: 'visible !important',
                },
                '& .mermaid': {
                    display: 'block !important',
                    width: '100%',
                    visibility: 'visible !important',
                },
                // Ensure content is always visible
                '& *': {
                    visibility: 'visible !important',
                }
            }}
        >
            {isLoading && !svgContent ? (
                <div style={{ padding: '20px', color: '#666' }}>
                    Loading diagram...
                </div>
            ) : svgContent ? (
                <div dangerouslySetInnerHTML={{ __html: svgContent }} />
            ) : null}
        </Box>
    );
};

export default MermaidDiagram;
