"use client";
import React, { useRef } from "react";

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

    return (
        <div className="flex flex-col h-screen w-full">
            <div className="flex items-center gap-4 p-4 bg-white border-b">
                <h1 className="text-2xl font-bold text-blue-700 flex-1">BPMN Workspace</h1>
                <button onClick={saveModel} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Model</button>
                <button onClick={loadModel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Load Model</button>
            </div>
            <div className="flex-1">
                <iframe
                    ref={iframeRef}
                    src="/comprehensive_bpmn_modeler.html"
                    title="BPMN Modeler"
                    className="w-full h-full border-0"
                />
            </div>
        </div>
    );
} 