import React, { useCallback, useEffect, useRef, useState } from 'react';
import './BPMNWorkspace.css';

const BPMNWorkspace: React.FC = () => {
    const [leftPanelWidth, setLeftPanelWidth] = useState(30); // 30%
    const [isDragging, setIsDragging] = useState(false);
    const [currentView, setCurrentView] = useState<'diagram' | 'xml'>('diagram');
    const [selectedElement, setSelectedElement] = useState<any>(null);
    const [modeler, setModeler] = useState<any>(null);
    const [propertyCache, setPropertyCache] = useState<Record<string, any>>({});
    const [xmlEditEnabled, setXmlEditEnabled] = useState(false);
    const splitterRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const xmlEditorRef = useRef<HTMLTextAreaElement>(null);

    // Empty BPMN XML to start from scratch
    const emptyXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
    xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
    xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
    xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
    xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
    xmlns:service="http://example.com/service"
    xmlns:script="http://example.com/script"
    xmlns:call="http://example.com/call"
    xmlns:data="http://example.com/data"
    id="Definitions_1"
    targetNamespace="http://bpmn.io/schema/bpmn">
    <bpmn:process id="Process_1" name="New Process" isExecutable="true">
    </bpmn:process>
    <bpmndi:BPMNDiagram id="BPMNDiagram_1">
        <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
        </bpmndi:BPMNPlane>
    </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        setIsDragging(true);
        e.preventDefault();
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;

        const containerRect = document.querySelector('.workspace-content')?.getBoundingClientRect();
        if (!containerRect) return;

        const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

        // Constrain between 10% and 90%
        const constrainedWidth = Math.max(10, Math.min(90, newLeftWidth));
        setLeftPanelWidth(constrainedWidth);
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    React.useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // Initialize BPMN modeler
    useEffect(() => {
        const initModeler = async () => {
            try {
                console.log('Starting BPMN modeler initialization...');

                // Check if BPMN.js library is available
                const BpmnModeler = (window as any).BpmnJS;
                if (!BpmnModeler) {
                    console.error('BPMN.js library not loaded. Please ensure the script is included in index.html');
                    return;
                }

                console.log('Creating BPMN modeler instance...');
                const modelerInstance = new BpmnModeler({
                    container: canvasRef.current,
                    keyboard: {
                        bindTo: window
                    }
                });

                console.log('BPMN Modeler created, importing XML...');

                await modelerInstance.importXML(emptyXML);
                setModeler(modelerInstance);

                // Verify that context pad is available
                try {
                    const contextPad = modelerInstance.get('contextPad');
                    const palette = modelerInstance.get('palette');
                    const selection = modelerInstance.get('selection');
                    console.log('BPMN modules available:', {
                        contextPad: !!contextPad,
                        palette: !!palette,
                        selection: !!selection
                    });
                } catch (e) {
                    console.warn('Some BPMN modules not available:', e);
                }

                // Add event listeners
                modelerInstance.on('element.click', (event: any) => {
                    setSelectedElement(event.element);
                    console.log('Element clicked:', event.element.type, event.element.id);
                });

                modelerInstance.on('selection.changed', (event: any) => {
                    if (event.newSelection && event.newSelection.length > 0) {
                        setSelectedElement(event.newSelection[0]);
                        console.log('Selection changed to:', event.newSelection[0].type, event.newSelection[0].id);
                    } else {
                        setSelectedElement(null);
                        console.log('Selection cleared');
                    }
                });

                // Ensure canvas is properly sized and context pad works
                setTimeout(() => {
                    const canvas = modelerInstance.get('canvas');
                    canvas.zoom('fit-viewport');

                    // Trigger a window resize to ensure all UI elements are properly sized
                    window.dispatchEvent(new Event('resize'));

                    console.log('BPMN modeler initialization complete');
                }, 100);

            } catch (error) {
                console.error('Modeler initialization error:', error);
            }
        };

        initModeler();
    }, []);

    // Handle canvas resize when splitter moves
    useEffect(() => {
        if (modeler) {
            const canvas = modeler.get('canvas');
            canvas.zoom('fit-viewport');

            // Trigger resize event for proper context pad positioning
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 100);
        }
    }, [leftPanelWidth, modeler]);

    // Utility functions from comprehensive solution
    const getExtensionProperty = useCallback((element: any, propertyName: string) => {
        if (!element || !element.businessObject) return '';

        const attrs = element.businessObject.$attrs || {};
        let value = attrs[propertyName] || '';

        if (!value) {
            const elementId = element.businessObject.id;
            if (propertyCache[elementId] && propertyCache[elementId][propertyName]) {
                value = propertyCache[elementId][propertyName];
            }
        }

        return value;
    }, [propertyCache]);

    const updateExtensionProperty = useCallback((element: any, propertyName: string, value: string) => {
        if (!element || !element.businessObject || !modeler) return;

        const modeling = modeler.get('modeling');
        let existingAttrs: Record<string, any> = {};

        if (element.businessObject.$attrs) {
            Object.keys(element.businessObject.$attrs).forEach(key => {
                if (key !== '$attrs' && key.startsWith('service.')) {
                    existingAttrs[key] = element.businessObject.$attrs[key];
                }
            });
        }

        if (value && value.trim() !== '') {
            existingAttrs[propertyName] = value;
        } else {
            delete existingAttrs[propertyName];
        }

        const properties: Record<string, any> = {};
        Object.keys(existingAttrs).forEach(key => {
            properties[key] = existingAttrs[key];
        });

        modeling.updateProperties(element, properties);

        // Update property cache
        const elementId = element.businessObject.id;
        setPropertyCache(prev => {
            const newCache = { ...prev };
            if (!newCache[elementId]) {
                newCache[elementId] = {};
            }
            if (value && value.trim() !== '') {
                newCache[elementId][propertyName] = value;
            } else {
                delete newCache[elementId][propertyName];
            }
            return newCache;
        });
    }, [modeler]);

    const updateBasicProperty = useCallback((propertyName: string, value: string) => {
        if (!selectedElement || !modeler) return;

        const modeling = modeler.get('modeling');

        if (propertyName === 'documentation') {
            const documentation = selectedElement.businessObject.documentation;
            if (!documentation) {
                const bpmnFactory = modeler.get('bpmnFactory');
                const newDoc = bpmnFactory.create('bpmn:Documentation', {
                    text: value
                });
                modeling.updateProperties(selectedElement, {
                    documentation: [newDoc]
                });
            } else {
                documentation[0].text = value;
            }
        } else {
            const properties: Record<string, any> = {};
            properties[propertyName] = value;
            modeling.updateProperties(selectedElement, properties);
        }
    }, [selectedElement, modeler]);

    const switchView = useCallback((view: 'diagram' | 'xml') => {
        setCurrentView(view);

        if (view === 'xml' && modeler && xmlEditorRef.current) {
            modeler.saveXML({ format: true }).then((result: any) => {
                if (xmlEditorRef.current) {
                    xmlEditorRef.current.value = result.xml;
                }
            });
        }
    }, [modeler]);

    return (
        <div className="bpmn-workspace">
            <div className="workspace-header">
                <h2>BPMN Workspace</h2>
                <p>Draggable vertical splitter - {leftPanelWidth.toFixed(0)}% | {(100 - leftPanelWidth).toFixed(0)}%</p>
            </div>

            <div className="workspace-content">
                {/* Left Panel */}
                <div
                    className="left-panel"
                    style={{ width: `${leftPanelWidth}%` }}
                >
                    <div className="panel-content">
                        <h3>Left Panel</h3>
                        <p>This is the left panel ({leftPanelWidth.toFixed(0)}%)</p>
                        <p>Ready for content implementation.</p>
                    </div>
                </div>

                {/* Vertical Splitter */}
                <div
                    ref={splitterRef}
                    className={`vertical-splitter ${isDragging ? 'dragging' : ''}`}
                    onMouseDown={handleMouseDown}
                />

                {/* Right Panel - BPMN Modeler */}
                <div
                    className="right-panel"
                    style={{ width: `${100 - leftPanelWidth}%` }}
                >
                    {/* BPMN Header Controls */}
                    <div className="bpmn-header">
                        <div className="view-toggle">
                            <button
                                className={`toggle-btn ${currentView === 'diagram' ? 'active' : ''}`}
                                onClick={() => switchView('diagram')}
                            >
                                Diagram View
                            </button>
                            <button
                                className={`toggle-btn ${currentView === 'xml' ? 'active' : ''}`}
                                onClick={() => switchView('xml')}
                            >
                                XML View
                            </button>
                            <div className="xml-edit-toggle">
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={xmlEditEnabled}
                                        onChange={(e) => setXmlEditEnabled(e.target.checked)}
                                    />
                                    <span className="slider"></span>
                                </label>
                                <span className="toggle-label">XML Edit</span>
                            </div>
                        </div>
                    </div>

                    {/* BPMN Main Content */}
                    <div className="bpmn-main-container">
                        {/* Canvas Container */}
                        <div className="canvas-container">
                            <div
                                ref={canvasRef}
                                className={`canvas ${currentView === 'xml' ? 'hidden' : ''}`}
                            />
                            <textarea
                                ref={xmlEditorRef}
                                className={`xml-editor ${currentView === 'diagram' ? 'hidden' : ''}`}
                                disabled={!xmlEditEnabled}
                                placeholder="BPMN XML will appear here..."
                            />
                        </div>

                        {/* Properties Panel */}
                        <div className="properties">
                            <div className="keyboard-shortcuts">
                                <h5>Keyboard Shortcuts:</h5>
                                <ul>
                                    <li><strong>Delete</strong> - Delete selected element</li>
                                    <li><strong>Ctrl+Z</strong> - Undo</li>
                                    <li><strong>Ctrl+Y</strong> - Redo</li>
                                    <li><strong>Ctrl+S</strong> - Export diagram</li>
                                </ul>
                            </div>
                            <div className="properties-content">
                                {selectedElement ? (
                                    <div>
                                        <div className="element-info">
                                            <h3>{selectedElement.businessObject.$type?.replace('bpmn:', '') || 'Element'}</h3>
                                            <p>ID: {selectedElement.businessObject.id}</p>
                                        </div>

                                        {selectedElement.businessObject.$type === 'bpmn:ServiceTask' && (
                                            <div>
                                                <div className="property-group">
                                                    <h4>General</h4>
                                                    <div className="property-field">
                                                        <label>Name</label>
                                                        <input
                                                            type="text"
                                                            value={selectedElement.businessObject.name || ''}
                                                            onChange={(e) => updateBasicProperty('name', e.target.value)}
                                                            placeholder="Service Task Name"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="property-group">
                                                    <h4>Implementation</h4>
                                                    <div className="property-field">
                                                        <label>Type</label>
                                                        <select
                                                            value={getExtensionProperty(selectedElement, 'camunda:type')}
                                                            onChange={(e) => updateExtensionProperty(selectedElement, 'camunda:type', e.target.value)}
                                                        >
                                                            <option value="">Select Type</option>
                                                            <option value="external">External</option>
                                                            <option value="expression">Expression</option>
                                                            <option value="connector">Connector</option>
                                                        </select>
                                                    </div>
                                                    <div className="property-field">
                                                        <label>Topic</label>
                                                        <input
                                                            type="text"
                                                            value={getExtensionProperty(selectedElement, 'camunda:topic')}
                                                            onChange={(e) => updateExtensionProperty(selectedElement, 'camunda:topic', e.target.value)}
                                                            placeholder="service-topic"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="property-group">
                                                    <h4>Extension Properties</h4>
                                                    <div className="property-field">
                                                        <label>Service Type</label>
                                                        <input
                                                            type="text"
                                                            value={getExtensionProperty(selectedElement, 'service.type')}
                                                            onChange={(e) => updateExtensionProperty(selectedElement, 'service.type', e.target.value)}
                                                            placeholder="assistant"
                                                        />
                                                    </div>
                                                    <div className="property-field">
                                                        <label>Service Name</label>
                                                        <input
                                                            type="text"
                                                            value={getExtensionProperty(selectedElement, 'service.name')}
                                                            onChange={(e) => updateExtensionProperty(selectedElement, 'service.name', e.target.value)}
                                                            placeholder="dadm-openai-assistant"
                                                        />
                                                    </div>
                                                    <div className="property-field">
                                                        <label>Service Version</label>
                                                        <input
                                                            type="text"
                                                            value={getExtensionProperty(selectedElement, 'service.version')}
                                                            onChange={(e) => updateExtensionProperty(selectedElement, 'service.version', e.target.value)}
                                                            placeholder="1.0"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {selectedElement.businessObject.$type !== 'bpmn:ServiceTask' && (
                                            <div className="property-group">
                                                <h4>Basic Properties</h4>
                                                <div className="property-field">
                                                    <label>Name</label>
                                                    <input
                                                        type="text"
                                                        value={selectedElement.businessObject.name || ''}
                                                        onChange={(e) => updateBasicProperty('name', e.target.value)}
                                                        placeholder="Element Name"
                                                    />
                                                </div>
                                                <div className="property-field">
                                                    <label>Element Type</label>
                                                    <input
                                                        type="text"
                                                        value={selectedElement.businessObject.$type || ''}
                                                        readOnly
                                                        style={{ background: '#f5f5f5' }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p>Select a BPMN element to edit its properties</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BPMNWorkspace;
