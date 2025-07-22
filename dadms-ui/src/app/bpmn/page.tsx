"use client";
import React, { useRef } from "react";
import { Button } from '../../components/shared/Button';
import { PageContent, PageLayout } from '../../components/shared/PageLayout';

const MODEL_STORAGE_KEY = "bpmn_workspace_model_xml";

export default function BPMNWorkspace() {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Send XML to iframe
    const loadModel = () => {
        const xml = localStorage.getItem(MODEL_STORAGE_KEY);
        if (xml && iframeRef.current) {
            iframeRef.current.contentWindow?.postMessage({ type: "load-bpmn", xml }, "*");
        }
    };

    // Listen for XML from iframe
    React.useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (event.data?.type === "export-bpmn" && event.data.xml) {
                localStorage.setItem(MODEL_STORAGE_KEY, event.data.xml);
                alert("Model saved to localStorage!");
            }
        };
        window.addEventListener("message", handler);
        return () => window.removeEventListener("message", handler);
    }, []);

    // Ask iframe to export XML
    const saveModel = () => {
        iframeRef.current?.contentWindow?.postMessage({ type: "request-export-bpmn" }, "*");
    };

    const pageActions = (
        <div className="flex items-center gap-2">
            <Button
                variant="primary"
                size="sm"
                leftIcon="save"
                onClick={saveModel}
            >
                Save Model
            </Button>
            <Button
                variant="secondary"
                size="sm"
                leftIcon="folder-opened"
                onClick={loadModel}
            >
                Load Model
            </Button>
        </div>
    );

    return (
        <PageLayout
            title="BPMN Workspace"
            subtitle="Design and manage business process workflows"
            icon="graph"
            actions={pageActions}
            status={{ text: 'Workflow Designer Active', type: 'active' }}
        >
            <PageContent maxWidth="full">
                <div className="h-full bg-gray-900">
                    <iframe
                        ref={iframeRef}
                        src="/comprehensive_bpmn_modeler.html"
                        title="BPMN Modeler"
                        className="w-full h-full border-0"
                        style={{ minHeight: 'calc(100vh - 200px)' }}
                    />
                </div>
            </PageContent>
        </PageLayout>
    );
} 