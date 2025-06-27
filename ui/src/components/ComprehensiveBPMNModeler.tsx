import React, { useEffect, useRef } from 'react';

interface ComprehensiveBPMNModelerProps {
    onModelChange?: (xml: string) => void;
}

const ComprehensiveBPMNModeler: React.FC<ComprehensiveBPMNModelerProps> = ({ onModelChange }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        // Optional: Listen for messages from the iframe if you need to sync data
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;

            if (event.data.type === 'bpmn-model-changed' && onModelChange) {
                onModelChange(event.data.xml);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onModelChange]);

    return (
        <div style={{ width: '100%', height: '100%', border: 'none' }}>
            <iframe
                ref={iframeRef}
                src="/comprehensive_bpmn_modeler.html"
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    backgroundColor: '#f5f5f5'
                }}
                title="Comprehensive BPMN Modeler"
            />
        </div>
    );
};

export default ComprehensiveBPMNModeler;
