'use client';

import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export interface BPMNModelerProps {
    className?: string;
    height?: string;
    onLoad?: () => void;
    onError?: (error: Error) => void;
}

export const BPMNModeler: React.FC<BPMNModelerProps> = ({
    className = '',
    height = '100vh',
    onLoad,
    onError
}) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const { theme } = useTheme();

    // Send theme changes to the iframe
    useEffect(() => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            try {
                iframeRef.current.contentWindow.postMessage({
                    type: 'theme-change',
                    theme: theme
                }, '*');
            } catch (error) {
                console.warn('Could not send theme message to BPMN modeler:', error);
            }
        }
    }, [theme]);

    const handleIframeLoad = () => {
        // Send initial theme to iframe
        if (iframeRef.current && iframeRef.current.contentWindow) {
            setTimeout(() => {
                try {
                    iframeRef.current?.contentWindow?.postMessage({
                        type: 'theme-change',
                        theme: theme
                    }, '*');
                } catch (error) {
                    console.warn('Could not send initial theme to BPMN modeler:', error);
                }
            }, 500); // Small delay to ensure iframe is fully loaded
        }

        onLoad?.();
    };

    const handleIframeError = () => {
        onError?.(new Error('Failed to load BPMN modeler'));
    };

    return (
        <div className={`bpmn-modeler-container ${className}`} style={{ height, minHeight: height }}>
            <iframe
                ref={iframeRef}
                src="/comprehensive_bpmn_modeler.html"
                title="BPMN Workflow Modeler"
                className="w-full h-full border-0"
                style={{
                    background: 'var(--theme-surface)',
                    transition: 'background-color 0.2s ease',
                    minHeight: '100%'
                }}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                sandbox="allow-scripts allow-same-origin allow-forms allow-downloads"
            />
        </div>
    );
}; 