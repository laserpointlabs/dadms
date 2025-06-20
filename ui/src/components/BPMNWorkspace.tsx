import React, { useEffect, useState } from 'react';
import BPMNChat from './BPMNChat';
import BPMNViewer from './BPMNViewer';
import './BPMNWorkspace.css';

interface BPMNModel {
    name: string;
    bpmn_xml: string;
    size: number;
}

const BPMNWorkspace: React.FC = () => {
    const [currentBPMN, setCurrentBPMN] = useState<string>('');
    const [availableModels, setAvailableModels] = useState<BPMNModel[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [workspaceLayout, setWorkspaceLayout] = useState<'side-by-side' | 'stacked'>('side-by-side');

    // Load available BPMN models on component mount
    useEffect(() => {
        loadAvailableModels();

        // Set responsive layout based on screen size
        const updateLayout = () => {
            setWorkspaceLayout(window.innerWidth >= 1024 ? 'side-by-side' : 'stacked');
        };

        updateLayout();
        window.addEventListener('resize', updateLayout);

        return () => window.removeEventListener('resize', updateLayout);
    }, []);

    const loadAvailableModels = async () => {
        setIsLoadingModels(true);
        try {
            const response = await fetch('/api/bpmn-ai/models');
            if (response.ok) {
                const data = await response.json();
                setAvailableModels(data.models || []);
            } else {
                console.error('Failed to load BPMN models');
            }
        } catch (error) {
            console.error('Error loading BPMN models:', error);
        } finally {
            setIsLoadingModels(false);
        }
    };

    const loadSelectedModel = async (modelName: string) => {
        try {
            const response = await fetch(`/api/bpmn-ai/models/${modelName}`);
            if (response.ok) {
                const data = await response.json();
                setCurrentBPMN(data.bpmn_xml);
                setSelectedModel(modelName);
            } else {
                console.error('Failed to load selected model');
            }
        } catch (error) {
            console.error('Error loading selected model:', error);
        }
    };

    const handleBPMNUpdate = (bpmnXml: string) => {
        setCurrentBPMN(bpmnXml);
        setSelectedModel(''); // Clear selected model since this is a new/modified model
    };

    const clearCurrentModel = () => {
        setCurrentBPMN('');
        setSelectedModel('');
    };

    const saveCurrentModel = async () => {
        if (!currentBPMN) return;

        const modelName = prompt('Enter a name for this BPMN model:', `process_${Date.now()}.bpmn`);
        if (!modelName) return;

        try {
            // For now, we'll just download the file
            // In a full implementation, you'd save to the server
            const blob = new Blob([currentBPMN], { type: 'application/xml' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = modelName.endsWith('.bpmn') ? modelName : `${modelName}.bpmn`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error saving model:', error);
            alert('Failed to save model');
        }
    };

    return (
        <div className={`bpmn-workspace ${workspaceLayout}`}>
            <div className="workspace-header">
                <div className="header-content">
                    <h1>BPMN AI Workspace</h1>
                    <p>Create and modify BPMN process models using natural language</p>
                </div>

                <div className="workspace-controls">
                    <div className="model-selector">
                        <select
                            value={selectedModel}
                            onChange={(e) => {
                                if (e.target.value) {
                                    loadSelectedModel(e.target.value);
                                } else {
                                    clearCurrentModel();
                                }
                            }}
                            disabled={isLoadingModels}
                        >
                            <option value="">New Model</option>
                            {availableModels.map((model) => (
                                <option key={model.name} value={model.name}>
                                    {model.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="action-buttons">
                        <button
                            onClick={clearCurrentModel}
                            disabled={!currentBPMN}
                            className="secondary-button"
                        >
                            🗑️ Clear
                        </button>
                        <button
                            onClick={saveCurrentModel}
                            disabled={!currentBPMN}
                            className="primary-button"
                        >
                            💾 Save
                        </button>
                        <button
                            onClick={() => setWorkspaceLayout(workspaceLayout === 'side-by-side' ? 'stacked' : 'side-by-side')}
                            className="layout-button"
                            title="Toggle Layout"
                        >
                            {workspaceLayout === 'side-by-side' ? '📱' : '💻'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="workspace-content">
                <div className="chat-panel">
                    <BPMNChat
                        onBPMNUpdate={handleBPMNUpdate}
                        currentBPMN={currentBPMN}
                    />
                </div>

                <div className="viewer-panel">
                    <BPMNViewer
                        bpmnXml={currentBPMN}
                        onElementClick={(element) => {
                            console.log('Element clicked:', element);
                            // Could be used to highlight elements or show properties
                        }}
                    />
                </div>
            </div>

            <div className="workspace-footer">
                <div className="status-info">
                    {currentBPMN ? (
                        <>
                            <span className="status-item">✅ Model loaded</span>
                            <span className="status-item">📊 {(currentBPMN.length / 1024).toFixed(1)}KB</span>
                            {selectedModel && (
                                <span className="status-item">📄 {selectedModel}</span>
                            )}
                        </>
                    ) : (
                        <span className="status-item">💬 Start a conversation to create a BPMN model</span>
                    )}
                </div>

                <div className="workspace-info">
                    <span className="info-item">🤖 Powered by OpenAI GPT-4</span>
                    <span className="info-item">📋 BPMN 2.0 Compatible</span>
                </div>
            </div>
        </div>
    );
};

export default BPMNWorkspace;
