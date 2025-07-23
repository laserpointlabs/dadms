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
    const loadTimeoutRef = useRef<NodeJS.Timeout>();

    // Set a timeout for iframe loading
    useEffect(() => {
        loadTimeoutRef.current = setTimeout(() => {
            console.warn('BPMN modeler loading timeout - forcing load completion');
            onLoad?.();
        }, 10000); // 10 second timeout

        return () => {
            if (loadTimeoutRef.current) {
                clearTimeout(loadTimeoutRef.current);
            }
        };
    }, [onLoad]);

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
        console.log('BPMN iframe loaded');

        // Clear the timeout since iframe loaded successfully
        if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current);
        }

        // Send initial theme to iframe with multiple attempts
        const sendThemeToIframe = (attempts = 0) => {
            if (attempts > 10) {
                console.warn('Failed to send theme to BPMN modeler after 10 attempts');
                onLoad?.();
                return;
            }

            if (iframeRef.current && iframeRef.current.contentWindow) {
                try {
                    iframeRef.current.contentWindow.postMessage({
                        type: 'theme-change',
                        theme: theme
                    }, '*');
                    console.log('Theme sent to BPMN modeler');
                    onLoad?.();
                } catch (error) {
                    console.warn(`Could not send theme to BPMN modeler (attempt ${attempts + 1}):`, error);
                    setTimeout(() => sendThemeToIframe(attempts + 1), 200);
                }
            } else {
                setTimeout(() => sendThemeToIframe(attempts + 1), 200);
            }
        };

        // Start sending theme after a short delay
        setTimeout(() => sendThemeToIframe(), 100);
    };

    const handleIframeError = () => {
        console.error('BPMN iframe failed to load');
        if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current);
        }
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
                allow="fullscreen"
                loading="eager"
            />
        </div>
    );
}; 