import React, { useEffect, useRef, useState } from 'react';
import BPMNChat from './BPMNChat';
import BPMNPropertiesPanel from './BPMNPropertiesPanel';
import BPMNViewer from './BPMNViewer';
import './BPMNWorkspace.css';

interface BPMNModel {
    name: string;
    bpmn_xml: string;
    size: number;
}

interface BPMNElement {
    id: string;
    type: string;
    name?: string;
    businessObject?: any;
}

const BPMNWorkspace: React.FC = () => {
    const [currentBPMN, setCurrentBPMN] = useState<string>('');
    const [availableModels, setAvailableModels] = useState<BPMNModel[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [workspaceLayout, setWorkspaceLayout] = useState<'side-by-side' | 'stacked'>('side-by-side');
    const [chatPanelWidth, setChatPanelWidth] = useState(25); // Percentage
    const [propertiesPanelWidth, setPropertiesPanelWidth] = useState(20); // Percentage
    const [selectedElement, setSelectedElement] = useState<BPMNElement | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const splitterRef = useRef<HTMLDivElement>(null);
    const propertiesSplitterRef = useRef<HTMLDivElement>(null);
    const bpmnViewerRef = useRef<any>(null);

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

    // Load BPMN XML from localStorage on mount
    useEffect(() => {
        console.log('=== localStorage Debug ===');
        console.log('All localStorage keys:', Object.keys(localStorage));
        const saved = localStorage.getItem('currentBpmnModel');
        console.log('Loading from localStorage:', saved ? 'Found model' : 'No model found');
        if (saved) {
            console.log('Setting currentBPMN from localStorage, length:', saved.length);
            console.log('First 200 chars of saved XML:', saved.substring(0, 200));
            setCurrentBPMN(saved);
        } else {
            console.log('No saved model found in localStorage');
        }
        console.log('=== End localStorage Debug ===');
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
                clearManualEditTracking(); // Clear manual edit tracking for loaded model
            } else {
                console.error('Failed to load selected model');
            }
        } catch (error) {
            console.error('Error loading selected model:', error);
        }
    };

    const handleBPMNUpdate = (bpmnXml: string) => {
        console.log('handleBPMNUpdate called with XML length:', bpmnXml.length);
        setCurrentBPMN(bpmnXml);
        setSelectedModel(''); // Clear selected model since this is a new/modified model
        localStorage.setItem('currentBpmnModel', bpmnXml);
        // Also save a timestamp of when the model was last modified
        localStorage.setItem('currentBpmnModelLastModified', new Date().toISOString());
        // Save a hash of the model to track changes
        const modelHash = btoa(bpmnXml).slice(0, 20); // Simple hash for change detection
        localStorage.setItem('currentBpmnModelHash', modelHash);
        console.log('BPMN model persisted to localStorage with hash:', modelHash);
        console.log('localStorage now contains:', localStorage.getItem('currentBpmnModel') ? 'XML saved' : 'XML NOT saved');
    };

    const clearCurrentModel = () => {
        setCurrentBPMN('');
        setSelectedModel('');
        // Remove from localStorage
        localStorage.removeItem('currentBpmnModel');
        localStorage.removeItem('currentBpmnModelLastModified');
        localStorage.removeItem('currentBpmnModelHash');
    };

    const clearManualEditTracking = () => {
        // Clear manual edit tracking when loading a new model from AI or file
        localStorage.removeItem('currentBpmnModelLastModified');
        localStorage.removeItem('currentBpmnModelHash');
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

    const loadFileFromDisk = () => {
        fileInputRef.current?.click();
    };

    const handleFileLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.bpmn') && !file.name.toLowerCase().endsWith('.xml')) {
            alert('Please select a BPMN (.bpmn) or XML (.xml) file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;

                // Basic validation to check if it looks like BPMN XML
                if (!content.includes('bpmn:definitions') && !content.includes('<definitions')) {
                    alert('This file does not appear to be a valid BPMN model');
                    return;
                }

                setCurrentBPMN(content);
                setSelectedModel(''); // Clear selected model since this is a loaded file
                clearManualEditTracking(); // Clear manual edit tracking for loaded file
                console.log(`Loaded BPMN file: ${file.name} (${(content.length / 1024).toFixed(1)}KB)`);
            } catch (error) {
                console.error('Error reading file:', error);
                alert('Failed to read the file');
            }
        };

        reader.onerror = () => {
            alert('Error reading the file');
        };

        reader.readAsText(file);

        // Clear the input so the same file can be loaded again if needed
        event.target.value = '';
    };

    // Drag handlers for split pane
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Mouse down on splitter - starting drag');

        const startX = e.clientX;
        const startWidth = chatPanelWidth;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - startX;
            const container = document.querySelector('.workspace-content') as HTMLElement;
            if (!container) return;

            const containerWidth = container.offsetWidth;
            const deltaPercent = (deltaX / containerWidth) * 100;
            const newWidth = startWidth + deltaPercent;

            // Constrain to reasonable limits (20% to 80%)
            const constrainedWidth = Math.max(20, Math.min(80, newWidth));
            setChatPanelWidth(constrainedWidth);
            console.log('Dragging - new width:', constrainedWidth);
        };

        const handleMouseUp = () => {
            console.log('Mouse up - ending drag');
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    // Drag handlers for properties panel splitter
    const handlePropertiesMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Mouse down on properties splitter - starting drag');

        const startX = e.clientX;
        const startWidth = propertiesPanelWidth;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = startX - e.clientX; // Reverse direction for right-side panel
            const container = document.querySelector('.workspace-content') as HTMLElement;
            if (!container) return;

            const containerWidth = container.offsetWidth;
            const deltaPercent = (deltaX / containerWidth) * 100;
            const newWidth = startWidth + deltaPercent;

            // Constrain to reasonable limits (15% to 40%)
            const constrainedWidth = Math.max(15, Math.min(40, newWidth));
            setPropertiesPanelWidth(constrainedWidth);
            console.log('Dragging properties - new width:', constrainedWidth);
        };

        const handleMouseUp = () => {
            console.log('Mouse up - ending properties drag');
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    const handleElementSelect = (element: BPMNElement | null) => {
        setSelectedElement(element);
    };

    const handlePropertyChange = (elementId: string, propertyPath: string, value: string) => {
        console.log('Property change:', elementId, propertyPath, value);
        // The BPMNViewer will handle the actual model updates
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
                        <button
                            onClick={loadFileFromDisk}
                            className="primary-button"
                            title="Load BPMN File"
                        >
                            📂 Load File
                        </button>
                    </div>
                </div>
            </div>

            <div className="workspace-content" style={{ height: '100%', minHeight: 0 }}>
                <div
                    className="chat-panel"
                    style={{
                        width: `${chatPanelWidth}%`,
                        height: '100%',
                        minHeight: 0,
                        overflow: 'auto',
                        borderRight: '1px solid #dee2e6'
                    }}
                >
                    <BPMNChat
                        onBPMNUpdate={handleBPMNUpdate}
                        currentBPMN={currentBPMN}
                        onAIModelGenerated={clearManualEditTracking}
                    />
                </div>

                <div
                    ref={splitterRef}
                    className="splitter"
                    onMouseDown={handleMouseDown}
                    onClick={() => console.log('Splitter clicked!')}
                    onMouseEnter={() => console.log('Mouse entered splitter')}
                    style={{
                        width: '8px',
                        height: '100%',
                        background: '#e9ecef',
                        cursor: 'col-resize',
                        position: 'relative',
                        zIndex: 10,
                        borderLeft: '1px solid #dee2e6',
                        borderRight: '1px solid #dee2e6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <div style={{
                        width: '2px',
                        height: '40px',
                        background: '#adb5bd',
                        borderRadius: '1px'
                    }} />
                </div>

                <div
                    className="workspace-main"
                    style={{
                        width: `${100 - chatPanelWidth}%`,
                        height: '100%',
                        minHeight: 0,
                        overflow: 'auto'
                    }}
                >
                    <div
                        className="bpmn-canvas-container"
                        style={{
                            width: `${100 - propertiesPanelWidth}%`,
                            height: '100%',
                            minHeight: 0,
                            overflow: 'auto'
                        }}
                    >
                        <BPMNViewer
                            ref={bpmnViewerRef}
                            bpmnXml={currentBPMN}
                            onModelChange={(xml) => {
                                console.log('BPMN model changed:', xml.length, 'characters');
                                handleBPMNUpdate(xml);
                            }}
                            isEditable={true}
                            onElementSelect={handleElementSelect}
                        />
                    </div>

                    <div
                        ref={propertiesSplitterRef}
                        className="splitter"
                        onMouseDown={handlePropertiesMouseDown}
                        style={{
                            width: '8px',
                            height: '100%',
                            background: '#e9ecef',
                            cursor: 'col-resize',
                            position: 'relative',
                            zIndex: 10,
                            borderLeft: '1px solid #dee2e6',
                            borderRight: '1px solid #dee2e6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <div style={{
                            width: '2px',
                            height: '40px',
                            background: '#adb5bd',
                            borderRadius: '1px'
                        }} />
                    </div>

                    <div
                        className="properties-panel-container"
                        style={{
                            width: `${propertiesPanelWidth}%`,
                            height: '100%',
                            minHeight: 0,
                            overflow: 'hidden'
                        }}
                    >
                        <BPMNPropertiesPanel
                            selectedElement={selectedElement}
                            onPropertyChange={handlePropertyChange}
                            modeler={bpmnViewerRef.current?.getModeler() || null}
                            onModelChange={handleBPMNUpdate}
                        />
                    </div>
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
                            {localStorage.getItem('currentBpmnModelLastModified') && (
                                <span className="status-item" style={{ color: '#28a745' }}>
                                    ✏️ Manually edited
                                </span>
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

            {/* Hidden file input for loading BPMN files */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".bpmn,.xml"
                onChange={handleFileLoad}
                style={{ display: 'none' }}
            />
        </div>
    );
};

export default BPMNWorkspace;
