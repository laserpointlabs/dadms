import { Settings, Workflow } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import './BPMNWorkspace.css';

const BPMNWorkspace: React.FC = () => {
    const [leftPanelWidth, setLeftPanelWidth] = useState(20); // 20% Manually edited dont change
    const [isDragging, setIsDragging] = useState(false);
    const [selectedElement, setSelectedElement] = useState<any>(null);
    const [modeler, setModeler] = useState<any>(null);
    const [propertyCache, setPropertyCache] = useState<Record<string, any>>({});
    const [cacheEnabled] = useState(true);
    const [diagramProperties, setDiagramProperties] = useState<any>(null);
    const [xmlPanelVisible, setXmlPanelVisible] = useState(false);
    const [xmlPanelHeight, setXmlPanelHeight] = useState(30); // 30% of canvas area
    const [isXmlDragging, setIsXmlDragging] = useState(false);
    const [propertiesWidth, setPropertiesWidth] = useState(20); // 20% of right panel
    const [isPropertiesDragging, setIsPropertiesDragging] = useState(false);
    const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
        general: false, // Default expanded for general section
        implementation: true,
        extensionProperties: true,
        advanced: true
    });
    const splitterRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const xmlEditorRef = useRef<HTMLTextAreaElement>(null);
    const xmlSplitterRef = useRef<HTMLDivElement>(null);
    const propertiesSplitterRef = useRef<HTMLDivElement>(null);

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
        <bpmn:documentation></bpmn:documentation>
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

    // XML Panel splitter handlers
    const handleXmlMouseDown = useCallback((e: React.MouseEvent) => {
        setIsXmlDragging(true);
        e.preventDefault();
    }, []);

    const handleXmlMouseMove = useCallback((e: MouseEvent) => {
        if (!isXmlDragging) return;

        const canvasContainer = document.querySelector('.canvas-main-area')?.getBoundingClientRect();
        if (!canvasContainer) return;

        const newHeight = ((canvasContainer.bottom - e.clientY) / canvasContainer.height) * 100;
        const constrainedHeight = Math.max(10, Math.min(80, newHeight));
        setXmlPanelHeight(constrainedHeight);
    }, [isXmlDragging]);

    const handleXmlMouseUp = useCallback(() => {
        setIsXmlDragging(false);
    }, []);

    // Properties splitter handlers
    const handlePropertiesMouseDown = useCallback((e: React.MouseEvent) => {
        setIsPropertiesDragging(true);
        e.preventDefault();
    }, []);

    const handlePropertiesMouseMove = useCallback((e: MouseEvent) => {
        if (!isPropertiesDragging) return;

        const rightPanel = document.querySelector('.right-panel')?.getBoundingClientRect();
        if (!rightPanel) return;

        const newWidth = ((rightPanel.right - e.clientX) / rightPanel.width) * 100;
        const constrainedWidth = Math.max(15, Math.min(50, newWidth));
        setPropertiesWidth(constrainedWidth);
    }, [isPropertiesDragging]);

    const handlePropertiesMouseUp = useCallback(() => {
        setIsPropertiesDragging(false);
    }, []);

    // XML panel mouse effect
    React.useEffect(() => {
        if (isXmlDragging) {
            document.addEventListener('mousemove', handleXmlMouseMove);
            document.addEventListener('mouseup', handleXmlMouseUp);
            document.body.style.cursor = 'row-resize';
            document.body.style.userSelect = 'none';
        } else {
            document.removeEventListener('mousemove', handleXmlMouseMove);
            document.removeEventListener('mouseup', handleXmlMouseUp);
            if (!isDragging && !isPropertiesDragging) {
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        }

        return () => {
            document.removeEventListener('mousemove', handleXmlMouseMove);
            document.removeEventListener('mouseup', handleXmlMouseUp);
        };
    }, [isXmlDragging, handleXmlMouseMove, handleXmlMouseUp, isDragging, isPropertiesDragging]);

    // Properties panel mouse effect
    React.useEffect(() => {
        if (isPropertiesDragging) {
            document.addEventListener('mousemove', handlePropertiesMouseMove);
            document.addEventListener('mouseup', handlePropertiesMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            document.removeEventListener('mousemove', handlePropertiesMouseMove);
            document.removeEventListener('mouseup', handlePropertiesMouseUp);
            if (!isDragging && !isXmlDragging) {
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        }

        return () => {
            document.removeEventListener('mousemove', handlePropertiesMouseMove);
            document.removeEventListener('mouseup', handlePropertiesMouseUp);
        };
    }, [isPropertiesDragging, handlePropertiesMouseMove, handlePropertiesMouseUp, isDragging, isXmlDragging]);

    // Model caching functions (simplified like in comprehensive solution)
    const saveModelToCache = useCallback((modelerInstance?: any) => {
        const modelerToUse = modelerInstance || modeler;
        if (!modelerToUse || !cacheEnabled) return;

        modelerToUse.saveXML({ format: true }).then((result: any) => {
            localStorage.setItem('bpmn_model_cache', result.xml);
            localStorage.setItem('bpmn_model_timestamp', Date.now().toString());
            console.log('Model saved to cache');
        }).catch((error: any) => {
            console.error('Error saving model to cache:', error);
        });
    }, [modeler, cacheEnabled]);

    // Simple cache loading function that doesn't depend on React state
    const loadModelFromCache = () => {
        const cachedXML = localStorage.getItem('bpmn_model_cache');
        const timestamp = localStorage.getItem('bpmn_model_timestamp');

        if (cachedXML && timestamp) {
            const age = Date.now() - parseInt(timestamp);
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours

            if (age < maxAge) {
                console.log('Loading model from cache (age:', Math.round(age / 1000 / 60), 'minutes)');
                return cachedXML;
            } else {
                // Clear expired cache
                localStorage.removeItem('bpmn_model_cache');
                localStorage.removeItem('bpmn_model_timestamp');
                console.log('Cache expired, cleared');
            }
        }

        return null;
    };

    const clearModelCache = () => {
        localStorage.removeItem('bpmn_model_cache');
        localStorage.removeItem('bpmn_model_timestamp');
        console.log('Model cache cleared');
    };

    // Get diagram properties
    const getDiagramProperties = useCallback(() => {
        if (!modeler) return null;
        try {
            const definitions = modeler.getDefinitions();
            const process = definitions.rootElements?.find((element: any) => element.$type === 'bpmn:Process');
            return {
                id: process?.id || 'Process_1',
                name: process?.name || 'New Process',
                documentation: process?.documentation?.[0]?.text || '',
                isExecutable: typeof process?.isExecutable === 'boolean' ? process.isExecutable : true,
                definitionsId: definitions.id || 'Definitions_1',
                targetNamespace: definitions.targetNamespace || 'http://bpmn.io/schema/bpmn'
            };
        } catch (error) {
            console.error('Error getting diagram properties:', error);
            return {
                id: 'Process_1',
                name: 'New Process',
                documentation: '',
                isExecutable: true,
                definitionsId: 'Definitions_1',
                targetNamespace: 'http://bpmn.io/schema/bpmn'
            };
        }
    }, [modeler]);

    // Function to inject extension properties into XML (similar to comprehensive solution)
    const injectExtensionProperties = useCallback((xml: string) => {
        if (!modeler) return xml;

        console.log('Injecting extension properties into XML...');
        const elementRegistry = modeler.get('elementRegistry');
        let result = xml;

        // Find all service tasks and inject their extension properties
        elementRegistry.forEach((element: any) => {
            const businessObject = element.businessObject;
            if (businessObject.$type === 'bpmn:ServiceTask') {
                console.log('Found service task for injection:', businessObject.id);
                console.log('Attributes:', businessObject.$attrs);
                result = injectServiceTaskExtensions(result, businessObject.id, businessObject.$attrs || {});
            }
        });

        console.log('Final XML length after injection:', result.length);
        return result;
    }, [modeler]);

    // Update diagram properties
    const updateDiagramProperty = useCallback((property: string, value: string) => {
        if (!modeler) return;

        try {
            const definitions = modeler.getDefinitions();
            const process = definitions.rootElements?.find((element: any) => element.$type === 'bpmn:Process');

            if (process) {
                if (property === 'name') {
                    process.name = value;
                } else if (property === 'id') {
                    process.id = value;
                } else if (property === 'documentation') {
                    if (!process.documentation) {
                        process.documentation = [];
                    }
                    if (process.documentation.length === 0) {
                        process.documentation.push({
                            $type: 'bpmn:Documentation',
                            text: value
                        });
                    } else {
                        process.documentation[0].text = value;
                    }
                } else if (property === 'isExecutable') {
                    process.isExecutable = value === 'true';
                }
                // Always update all fields in state
                setDiagramProperties({
                    id: process.id || 'Process_1',
                    name: process.name || 'New Process',
                    documentation: process.documentation?.[0]?.text || '',
                    isExecutable: typeof process.isExecutable === 'boolean' ? process.isExecutable : true,
                    definitionsId: definitions.id || 'Definitions_1',
                    targetNamespace: definitions.targetNamespace || 'http://bpmn.io/schema/bpmn'
                });
                // Save to cache with injected extension properties
                modeler.saveXML({ format: true }).then((result: any) => {
                    const injectedXml = injectExtensionProperties(result.xml);
                    localStorage.setItem('bpmn_model_cache', injectedXml);
                    localStorage.setItem('bpmn_model_timestamp', Date.now().toString());
                });
            }
        } catch (error) {
            console.error('Error updating diagram property:', error);
        }
    }, [modeler, injectExtensionProperties]);

    // Initialize BPMN modeler
    useEffect(() => {
        const initModeler = async () => {
            try {
                console.log('Starting BPMN modeler initialization...');
                console.log('Checking cache first...');

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

                // Try to load from cache first (always check cache regardless of cacheEnabled state during init)
                const cachedXML = loadModelFromCache();
                let xmlToLoad = emptyXML;
                let loadMessage = 'Importing empty BPMN diagram...';

                if (cachedXML) {
                    xmlToLoad = cachedXML;
                    loadMessage = 'Loading cached BPMN diagram...';
                    console.log('Found cached model, loading...');
                } else {
                    console.log('No cached model found, using empty XML');
                }

                console.log(loadMessage);
                await modelerInstance.importXML(xmlToLoad);
                setModeler(modelerInstance);
                // Immediately extract process properties from the just-imported model
                const definitions = modelerInstance.getDefinitions();
                const process = definitions.rootElements?.find((element: any) => element.$type === 'bpmn:Process');
                setDiagramProperties({
                    id: process?.id || 'Process_1',
                    name: process?.name || 'New Process',
                    documentation: process?.documentation?.[0]?.text || '',
                    isExecutable: process?.isExecutable || true,
                    definitionsId: definitions.id || 'Definitions_1',
                    targetNamespace: definitions.targetNamespace || 'http://bpmn.io/schema/bpmn'
                });

                // Initialize property cache from loaded XML
                if (cachedXML) {
                    // Extract properties from the loaded cached XML
                    extractAndCacheExtensionProperties(modelerInstance, xmlToLoad);
                }

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
                    console.log('Element clicked - type:', event.element.type, 'id:', event.element.id);
                    console.log('Element businessObject type:', event.element.businessObject?.$type);

                    // If clicking on the canvas/process root, treat as no selection
                    if (event.element.type === 'bpmn:Process' ||
                        event.element.id === 'Process_1' ||
                        event.element.businessObject?.$type === 'bpmn:Process') {
                        setSelectedElement(null);
                        console.log('Canvas/Process clicked - clearing selection');
                    } else {
                        setSelectedElement(event.element);
                        console.log('Element selected:', event.element.type, event.element.id);
                    }
                    saveModelToCache(modelerInstance);
                });

                modelerInstance.on('selection.changed', (event: any) => {
                    if (event.newSelection && event.newSelection.length > 0) {
                        const element = event.newSelection[0];
                        console.log('Selection changed - type:', element.type, 'id:', element.id);
                        console.log('Selection businessObject type:', element.businessObject?.$type);

                        // If selecting the canvas/process root, treat as no selection
                        if (element.type === 'bpmn:Process' ||
                            element.id === 'Process_1' ||
                            element.businessObject?.$type === 'bpmn:Process') {
                            setSelectedElement(null);
                            setDiagramProperties(getDiagramProperties()); // Ensure diagramProperties is always set
                            console.log('Process/Canvas selected - showing diagram properties');
                        } else {
                            setSelectedElement(element);
                            setDiagramProperties(getDiagramProperties()); // Also update diagramProperties for consistency
                            console.log('Element selected via selection change:', element.type, element.id);
                        }
                    } else {
                        setSelectedElement(null);
                        setDiagramProperties(getDiagramProperties()); // Always set diagramProperties when nothing is selected
                        console.log('Selection cleared');
                    }
                    // Update diagram properties whenever selection changes
                    setDiagramProperties(getDiagramProperties());
                });

                // Auto-save on model changes
                modelerInstance.on('commandStack.changed', () => {
                    saveModelToCache(modelerInstance);
                });

                modelerInstance.on('element.changed', () => {
                    saveModelToCache(modelerInstance);
                });

                // Ensure canvas is properly sized and context pad works
                setTimeout(() => {
                    const canvas = modelerInstance.get('canvas');
                    canvas.zoom('fit-viewport');

                    // Initialize diagram properties
                    setDiagramProperties(getDiagramProperties());

                    // Trigger a window resize to ensure all UI elements are properly sized
                    window.dispatchEvent(new Event('resize'));

                    console.log('BPMN modeler initialization complete');
                }, 100);

            } catch (error) {
                console.error('Modeler initialization error:', error);
            }
        };

        initModeler();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Dependencies intentionally omitted to prevent re-initialization

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

    const clearModel = useCallback(() => {
        if (window.confirm('Are you sure you want to clear the entire model? This cannot be undone.')) {
            if (modeler) {
                // Import empty XML
                modeler.importXML(emptyXML).then(() => {
                    setSelectedElement(null);
                    setPropertyCache({});
                    clearModelCache();

                    // Update diagram properties with the new empty model
                    setDiagramProperties({
                        id: 'Process_1',
                        name: 'New Process',
                        documentation: '',
                        isExecutable: true,
                        definitionsId: 'Definitions_1',
                        targetNamespace: 'http://bpmn.io/schema/bpmn'
                    });

                    // Save the empty model to cache so refresh does not reload old model
                    modeler.saveXML({ format: true }).then((result: any) => {
                        localStorage.setItem('bpmn_model_cache', result.xml);
                        localStorage.setItem('bpmn_model_timestamp', Date.now().toString());
                    });

                    // Zoom to fit after clearing
                    setTimeout(() => {
                        const canvas = modeler.get('canvas');
                        canvas.zoom('fit-viewport');
                    }, 100);

                    console.log('Model cleared and cache removed');
                }).catch((error: any) => {
                    console.error('Error clearing model:', error);
                });
            }
        }
    }, [modeler, emptyXML]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Ctrl+Shift+C to clear model
            if (event.ctrlKey && event.shiftKey && event.key === 'C') {
                event.preventDefault();
                clearModel();
            }
            // Ctrl+S to save (already handled by BPMN.js, but we can add cache save)
            if (event.ctrlKey && event.key === 's') {
                event.preventDefault();
                saveModelToCache();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [clearModel, saveModelToCache]);

    // Extract and cache extension properties from XML (like in comprehensive solution)
    const extractAndCacheExtensionProperties = useCallback((modelerInstance: any, xmlContent: string) => {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

            const newCache: Record<string, any> = {};

            // Find all service tasks
            const serviceTasks = xmlDoc.querySelectorAll('bpmn\\:serviceTask, serviceTask');

            serviceTasks.forEach(serviceTask => {
                const taskId = serviceTask.getAttribute('id');
                if (!taskId) return;

                // Initialize cache for this element
                newCache[taskId] = {};

                // Find extension elements
                const extensionElements = serviceTask.querySelector('bpmn\\:extensionElements, extensionElements');
                if (!extensionElements) return;

                // Extract camunda properties
                const properties = extensionElements.querySelectorAll('camunda\\:property, camunda\\:properties camunda\\:property');

                properties.forEach(prop => {
                    const name = prop.getAttribute('name');
                    const value = prop.getAttribute('value');
                    if (name && value) {
                        newCache[taskId][name] = value;
                        console.log('Cached property:', taskId, name, '=', value);
                    }
                });
            });

            setPropertyCache(newCache);
            console.log('Property cache updated:', newCache);
        } catch (error) {
            console.error('Error extracting properties for cache:', error);
        }
    }, []);

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

        // Auto-save to cache
        saveModelToCache();
    }, [modeler, saveModelToCache]);

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

        // Auto-save to cache
        saveModelToCache();
    }, [selectedElement, modeler, saveModelToCache]);

    // Function to inject service task extensions (similar to comprehensive solution)
    const injectServiceTaskExtensions = useCallback((xml: string, elementId: string, attrs: Record<string, any>) => {
        console.log('Injecting extensions for service task:', elementId, attrs);

        // Extract service properties from element attributes or property cache
        const actualAttrs = { ...attrs };

        // Merge with cached properties
        if (propertyCache[elementId]) {
            Object.assign(actualAttrs, propertyCache[elementId]);
        }

        const serviceType = actualAttrs['service.type'];
        const serviceName = actualAttrs['service.name'];
        const serviceVersion = actualAttrs['service.version'];

        console.log('Service properties to inject:', { serviceType, serviceName, serviceVersion });

        if (!serviceType && !serviceName && !serviceVersion) {
            console.log('No service properties to inject for', elementId);
            return xml;
        }

        // Build extension elements
        let extensionElements = '';
        extensionElements += '\n  <bpmn:extensionElements>';
        extensionElements += '\n    <camunda:properties>';
        if (serviceType) {
            extensionElements += `\n      <camunda:property name="service.type" value="${serviceType}" />`;
        }
        if (serviceName) {
            extensionElements += `\n      <camunda:property name="service.name" value="${serviceName}" />`;
        }
        if (serviceVersion) {
            extensionElements += `\n      <camunda:property name="service.version" value="${serviceVersion}" />`;
        }
        extensionElements += '\n    </camunda:properties>';
        extensionElements += '\n  </bpmn:extensionElements>';

        console.log('Extension elements to add:', extensionElements);

        // Handle self-closing service tasks: <bpmn:serviceTask id="..." service:type="..." />
        const selfClosingRegex = new RegExp(
            `(<bpmn:serviceTask[^>]*id="${elementId}"[^>]*)(\\s*/>)`,
            'g'
        );

        let result = xml.replace(selfClosingRegex, (match, startTag, selfClosing) => {
            console.log('Found self-closing service task in XML:', elementId);
            console.log('Start tag:', startTag);

            // Remove service attributes from start tag
            let cleanStartTag = startTag;
            cleanStartTag = cleanStartTag.replace(/\s+service\.type="[^"]*"/g, '');
            cleanStartTag = cleanStartTag.replace(/\s+service\.name="[^"]*"/g, '');
            cleanStartTag = cleanStartTag.replace(/\s+service\.version="[^"]*"/g, '');
            cleanStartTag = cleanStartTag.replace(/\s+\$attrs="\[object Object\]"/g, '');

            console.log('Clean start tag:', cleanStartTag);

            // Convert self-closing to opening tag + content + closing tag
            const newContent = cleanStartTag + '>' + extensionElements + '\n    </bpmn:serviceTask>';
            console.log('New content:', newContent);
            return newContent;
        });

        // Handle regular service tasks with opening/closing tags
        const regularRegex = new RegExp(
            `(<bpmn:serviceTask[^>]*id="${elementId}"[^>]*>)([\\s\\S]*?)(</bpmn:serviceTask>)`,
            'g'
        );

        result = result.replace(regularRegex, (match, startTag, content, endTag) => {
            console.log('Found regular service task in XML:', elementId);
            console.log('Start tag:', startTag);
            console.log('Content:', content);
            console.log('End tag:', endTag);

            // Remove service attributes from start tag
            let cleanStartTag = startTag;
            cleanStartTag = cleanStartTag.replace(/\s+service\.type="[^"]*"/g, '');
            cleanStartTag = cleanStartTag.replace(/\s+service\.name="[^"]*"/g, '');
            cleanStartTag = cleanStartTag.replace(/\s+service\.version="[^"]*"/g, '');
            cleanStartTag = cleanStartTag.replace(/\s+\$attrs="\[object Object\]"/g, '');

            console.log('Clean start tag:', cleanStartTag);

            // Check if extension elements already exist in content
            if (content.includes('<bpmn:extensionElements>')) {
                console.log('Extension elements already exist, removing old ones');
                // Remove existing extension elements
                content = content.replace(/<bpmn:extensionElements>[\s\S]*?<\/bpmn:extensionElements>/g, '');
            }

            const newContent = cleanStartTag + content + extensionElements + endTag;
            console.log('New content:', newContent);
            return newContent;
        });

        console.log('XML injection result length:', result.length);
        return result;
    }, [propertyCache]);

    const toggleXmlPanel = useCallback(() => {
        const newVisible = !xmlPanelVisible;
        setXmlPanelVisible(newVisible);

        if (newVisible && modeler && xmlEditorRef.current) {
            console.log('Toggling XML panel to visible, updating XML content...');
            console.log('Modeler available:', !!modeler);
            console.log('XML editor ref available:', !!xmlEditorRef.current);
            console.log('Modeler type:', typeof modeler);
            console.log('Modeler has saveXML:', typeof modeler.saveXML);

            if (typeof modeler.saveXML !== 'function') {
                console.error('Modeler saveXML is not a function, modeler may not be properly initialized');
                return;
            }

            modeler.saveXML({ format: true }).then((result: any) => {
                console.log('XML retrieved from modeler, length:', result.xml.length);
                console.log('XML preview:', result.xml.substring(0, 200) + '...');

                // Try to inject extension properties, but use original XML if it fails
                let xmlToShow = result.xml;
                try {
                    xmlToShow = injectExtensionProperties(result.xml);
                    console.log('XML after extension injection, length:', xmlToShow.length);
                } catch (injectionError) {
                    console.warn('Extension injection failed, using original XML:', injectionError);
                }

                if (xmlEditorRef.current) {
                    xmlEditorRef.current.value = xmlToShow;
                    console.log('XML set to editor successfully, editor value length:', xmlEditorRef.current.value.length);
                } else {
                    console.error('XML editor ref is null when trying to set value');
                }
            }).catch((error: any) => {
                console.error('Error retrieving XML from modeler:', error);
                // Fallback: try to show empty XML or cached XML
                if (xmlEditorRef.current) {
                    const cachedXML = loadModelFromCache();
                    xmlEditorRef.current.value = cachedXML || emptyXML;
                    console.log('Fallback: Set cached or empty XML to editor');
                }
            });
        } else if (newVisible) {
            console.log('XML panel toggle failed - missing dependencies:');
            console.log('newVisible:', newVisible);
            console.log('modeler available:', !!modeler);
            console.log('xmlEditorRef.current available:', !!xmlEditorRef.current);
        }
    }, [xmlPanelVisible, modeler, injectExtensionProperties]);

    // Update XML content when panel becomes visible
    useEffect(() => {
        if (xmlPanelVisible && modeler && xmlEditorRef.current) {
            console.log('XML panel became visible via useEffect, updating content...');
            console.log('Modeler state:', !!modeler);
            console.log('XML editor ref state:', !!xmlEditorRef.current);

            modeler.saveXML({ format: true }).then((result: any) => {
                console.log('XML content updated via useEffect, length:', result.xml.length);
                console.log('XML preview:', result.xml.substring(0, 200) + '...');

                // Try to inject extension properties, but use original XML if it fails
                let xmlToShow = result.xml;
                try {
                    xmlToShow = injectExtensionProperties(result.xml);
                } catch (injectionError) {
                    console.warn('Extension injection failed in useEffect, using original XML:', injectionError);
                }

                if (xmlEditorRef.current) {
                    xmlEditorRef.current.value = xmlToShow;
                    console.log('XML set to editor via useEffect successfully');
                } else {
                    console.error('XML editor ref became null during useEffect');
                }
            }).catch((error: any) => {
                console.error('Error updating XML content via useEffect:', error);
                // Fallback to cached or empty XML
                if (xmlEditorRef.current) {
                    const cachedXML = loadModelFromCache();
                    xmlEditorRef.current.value = cachedXML || emptyXML;
                    console.log('Fallback: Set cached or empty XML via useEffect');
                }
            });
        } else if (xmlPanelVisible) {
            console.log('XML panel visible but missing dependencies in useEffect:');
            console.log('modeler:', !!modeler);
            console.log('xmlEditorRef.current:', !!xmlEditorRef.current);
        }
    }, [xmlPanelVisible, modeler, injectExtensionProperties]);

    // Update XML textarea whenever the model changes and the XML panel is open
    useEffect(() => {
        if (!modeler || !xmlPanelVisible || !xmlEditorRef.current) return;
        // Save XML and inject extension properties
        modeler.saveXML({ format: true }).then((result: any) => {
            let xmlToShow = result.xml;
            try {
                xmlToShow = injectExtensionProperties(result.xml);
            } catch (injectionError) {
                // fallback to raw xml
            }
            if (xmlEditorRef.current) {
                xmlEditorRef.current.value = xmlToShow;
            }
        });
    }, [modeler, xmlPanelVisible, selectedElement, propertyCache, diagramProperties]);

    const toggleKeyboardShortcuts = useCallback(() => {
        setShowKeyboardShortcuts(!showKeyboardShortcuts);
    }, [showKeyboardShortcuts]);

    // Toggle collapsible sections
    const toggleSection = useCallback((sectionName: string) => {
        setCollapsedSections(prev => ({
            ...prev,
            [sectionName]: !prev[sectionName]
        }));
    }, []);

    // Debug logging for layout
    useEffect(() => {
        console.log('Layout Debug:', {
            leftPanelWidth,
            propertiesWidth,
            xmlPanelVisible,
            xmlPanelHeight,
            canvasRefCurrent: !!canvasRef.current
        });
    }, [leftPanelWidth, propertiesWidth, xmlPanelVisible, xmlPanelHeight]);

    // Ensure properties panel is populated after model import or refresh
    useEffect(() => {
        if (modeler && !diagramProperties) {
            try {
                const definitions = modeler.getDefinitions();
                const process = definitions.rootElements?.find((element: any) => element.$type === 'bpmn:Process');
                setDiagramProperties({
                    id: process?.id || 'Process_1',
                    name: process?.name || 'New Process',
                    documentation: process?.documentation?.[0]?.text || '',
                    isExecutable: process?.isExecutable || true,
                    definitionsId: definitions.id || 'Definitions_1',
                    targetNamespace: definitions.targetNamespace || 'http://bpmn.io/schema/bpmn'
                });
            } catch (error) {
                // fallback: do nothing
            }
        }
    }, [modeler, diagramProperties]);

    return (
        <div className="bpmn-workspace">
            <div className="workspace-header">
                <h2>BPMN Workspace</h2>
                <p>
                    Draggable vertical splitter - {leftPanelWidth.toFixed(0)}% | {(100 - leftPanelWidth).toFixed(0)}%
                    {cacheEnabled && (
                        <span style={{ marginLeft: '20px', color: '#28a745' }}>
                            📁 Cache Enabled (24h auto-expire)
                        </span>
                    )}
                </p>
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
                    {/* BPMN Main Content */}
                    <div className="bpmn-main-container">
                        {/* Canvas and Properties Container */}
                        <div className="canvas-properties-container">
                            {/* Canvas Main Area */}
                            <div
                                className="canvas-main-area"
                                style={{ width: `${100 - propertiesWidth}%` }}
                            >
                                {/* Canvas Container */}
                                <div
                                    className="canvas-container"
                                    style={{
                                        height: xmlPanelVisible ? `${100 - xmlPanelHeight}%` : '100%'
                                    }}
                                >
                                    <div
                                        ref={canvasRef}
                                        className="canvas"
                                    />
                                </div>

                                {/* XML Panel - Bottom Popup */}
                                {xmlPanelVisible && (
                                    <>
                                        {/* XML Splitter */}
                                        <div
                                            ref={xmlSplitterRef}
                                            className={`xml-splitter ${isXmlDragging ? 'dragging' : ''}`}
                                            onMouseDown={handleXmlMouseDown}
                                        />

                                        {/* XML Editor */}
                                        <div
                                            className="xml-panel"
                                            style={{ height: `${xmlPanelHeight}%` }}
                                        >
                                            <div className="xml-panel-header">
                                                <h4>BPMN XML</h4>
                                                <button
                                                    className="xml-panel-close"
                                                    onClick={toggleXmlPanel}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                            <textarea
                                                ref={xmlEditorRef}
                                                className="xml-editor"
                                                readOnly
                                                placeholder="BPMN XML will appear here..."
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Properties Splitter */}
                            <div
                                ref={propertiesSplitterRef}
                                className={`properties-splitter ${isPropertiesDragging ? 'dragging' : ''}`}
                                onMouseDown={handlePropertiesMouseDown}
                            />

                            {/* Properties Panel */}
                            <div
                                className="properties"
                                style={{ width: `${propertiesWidth}%` }}
                            >
                                {/* Properties Panel Header */}
                                <div className="properties-header">
                                    <div className="properties-header-main">
                                        <div className="properties-header-title">
                                            <Settings className="header-icon gear" size={16} />
                                            <h3>{diagramProperties?.name || 'New Process'}</h3>
                                        </div>
                                        <span className="properties-subtitle">Properties</span>
                                    </div>
                                </div>

                                <div className="properties-content">
                                    {selectedElement ? (
                                        <div>
                                            <div className="element-info">
                                                <h4>{selectedElement.businessObject.$type?.replace('bpmn:', '') || 'Element'}</h4>
                                                <p>ID: {selectedElement.businessObject.id}</p>
                                            </div>

                                            {selectedElement.businessObject.$type === 'bpmn:ServiceTask' && (
                                                <div>
                                                    {/* General Section */}
                                                    <div className="property-group">
                                                        <div
                                                            className="property-group-header"
                                                            onClick={() => toggleSection('general')}
                                                        >
                                                            <span className={`collapse-icon ${collapsedSections.general ? 'collapsed' : ''}`}>▼</span>
                                                            <h4>General</h4>
                                                        </div>
                                                        {!collapsedSections.general && (
                                                            <div className="property-group-content">
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
                                                        )}
                                                    </div>

                                                    {/* Implementation Section */}
                                                    <div className="property-group">
                                                        <div
                                                            className="property-group-header"
                                                            onClick={() => toggleSection('implementation')}
                                                        >
                                                            <span className={`collapse-icon ${collapsedSections.implementation ? 'collapsed' : ''}`}>▼</span>
                                                            <h4>Implementation</h4>
                                                        </div>
                                                        {!collapsedSections.implementation && (
                                                            <div className="property-group-content">
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
                                                        )}
                                                    </div>

                                                    {/* Extension Properties Section */}
                                                    <div className="property-group">
                                                        <div
                                                            className="property-group-header"
                                                            onClick={() => toggleSection('extensionProperties')}
                                                        >
                                                            <span className={`collapse-icon ${collapsedSections.extensionProperties ? 'collapsed' : ''}`}>▼</span>
                                                            <h4>Extension Properties</h4>
                                                        </div>
                                                        {!collapsedSections.extensionProperties && (
                                                            <div className="property-group-content">
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
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {selectedElement.businessObject.$type !== 'bpmn:ServiceTask' && (
                                                <div className="property-group">
                                                    <div
                                                        className="property-group-header"
                                                        onClick={() => toggleSection('general')}
                                                    >
                                                        <span className={`collapse-icon ${collapsedSections.general ? 'collapsed' : ''}`}>▼</span>
                                                        <h4>General Properties</h4>
                                                    </div>
                                                    {!collapsedSections.general && (
                                                        <div className="property-group-content">
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
                                            )}
                                        </div>
                                    ) : (
                                        // Show diagram properties when nothing is selected
                                        <div>
                                            <div className="element-info">
                                                <h4><Workflow size={16} style={{ display: 'inline', marginRight: '6px' }} /> Diagram</h4>
                                                <p>Process ID: {diagramProperties?.id || 'Process_1'}</p>
                                            </div>

                                            {/* General Section */}
                                            <div className="property-group">
                                                <div
                                                    className="property-group-header"
                                                    onClick={() => toggleSection('general')}
                                                >
                                                    <span className={`collapse-icon ${collapsedSections.general ? 'collapsed' : ''}`}>▼</span>
                                                    <h4>General</h4>
                                                </div>
                                                {!collapsedSections.general && (
                                                    <div className="property-group-content">
                                                        <div className="property-field">
                                                            <label>Name</label>
                                                            <input
                                                                type="text"
                                                                value={diagramProperties?.name || ''}
                                                                onChange={(e) => updateDiagramProperty('name', e.target.value)}
                                                                placeholder="Process Name"
                                                            />
                                                        </div>
                                                        <div className="property-field">
                                                            <label>ID</label>
                                                            <input
                                                                type="text"
                                                                value={diagramProperties?.id || ''}
                                                                onChange={(e) => updateDiagramProperty('id', e.target.value)}
                                                                placeholder="Process_1"
                                                            />
                                                        </div>
                                                        <div className="property-field">
                                                            <label>Documentation</label>
                                                            <textarea
                                                                value={diagramProperties?.documentation || ''}
                                                                onChange={(e) => updateDiagramProperty('documentation', e.target.value)}
                                                                placeholder="Process documentation..."
                                                                rows={3}
                                                            />
                                                        </div>
                                                        <div className="property-field">
                                                            <label>Executable</label>
                                                            <select
                                                                value={diagramProperties?.isExecutable ? 'true' : 'false'}
                                                                onChange={(e) => updateDiagramProperty('isExecutable', e.target.value)}
                                                            >
                                                                <option value="true">Yes</option>
                                                                <option value="false">No</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Advanced Section */}
                                            <div className="property-group">
                                                <div
                                                    className="property-group-header"
                                                    onClick={() => toggleSection('advanced')}
                                                >
                                                    <span className={`collapse-icon ${collapsedSections.advanced ? 'collapsed' : ''}`}>▼</span>
                                                    <h4>Advanced</h4>
                                                </div>
                                                {!collapsedSections.advanced && (
                                                    <div className="property-group-content">
                                                        <div className="property-field">
                                                            <label>Target Namespace</label>
                                                            <input
                                                                type="text"
                                                                value={diagramProperties?.targetNamespace || ''}
                                                                readOnly
                                                                style={{ background: '#f5f5f5' }}
                                                            />
                                                        </div>
                                                        <div className="property-field">
                                                            <label>Definitions ID</label>
                                                            <input
                                                                type="text"
                                                                value={diagramProperties?.definitionsId || ''}
                                                                readOnly
                                                                style={{ background: '#f5f5f5' }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Toolbar */}
                    <div className="bottom-toolbar">
                        <div className="toolbar-left">
                            <button
                                className={`toolbar-btn xml-toggle ${xmlPanelVisible ? 'active' : ''}`}
                                onClick={toggleXmlPanel}
                                title="Toggle XML View"
                            >
                                {xmlPanelVisible ? '📄 Hide XML' : '📄 Show XML'}
                            </button>
                            <button
                                className="toolbar-btn shortcuts-btn"
                                onClick={toggleKeyboardShortcuts}
                                title="Show Keyboard Shortcuts"
                            >
                                ⌨️ Shortcuts
                            </button>
                            <button
                                className="toolbar-btn clear-btn"
                                style={{ background: '#dc3545', color: 'white', borderColor: '#dc3545' }}
                                onClick={clearModel}
                                title="Clear Model"
                            >
                                🗑️ Clear Model
                            </button>
                        </div>
                        <div className="toolbar-right">
                            <span className="cache-status">
                                {cacheEnabled ? '📁 Auto-save enabled' : '📁 Auto-save disabled'}
                            </span>
                        </div>
                    </div>

                    {/* Keyboard Shortcuts Popup */}
                    {showKeyboardShortcuts && (
                        <div className="shortcuts-overlay" onClick={toggleKeyboardShortcuts}>
                            <div className="shortcuts-popup" onClick={(e) => e.stopPropagation()}>
                                <div className="shortcuts-header">
                                    <h4>Keyboard Shortcuts</h4>
                                    <button
                                        className="shortcuts-close"
                                        onClick={toggleKeyboardShortcuts}
                                    >
                                        ×
                                    </button>
                                </div>
                                <div className="shortcuts-content">
                                    <div className="shortcut-group">
                                        <h5>General</h5>
                                        <ul>
                                            <li><kbd>Delete</kbd> - Delete selected element</li>
                                            <li><kbd>Ctrl</kbd> + <kbd>Z</kbd> - Undo</li>
                                            <li><kbd>Ctrl</kbd> + <kbd>Y</kbd> - Redo</li>
                                            <li><kbd>Ctrl</kbd> + <kbd>S</kbd> - Save to cache</li>
                                            <li><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>C</kbd> - Clear all</li>
                                        </ul>
                                    </div>
                                    <div className="shortcut-group">
                                        <h5>Navigation</h5>
                                        <ul>
                                            <li><kbd>Mouse wheel</kbd> - Zoom in/out</li>
                                            <li><kbd>Space</kbd> + <kbd>Drag</kbd> - Pan canvas</li>
                                            <li><kbd>Ctrl</kbd> + <kbd>0</kbd> - Zoom to fit</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BPMNWorkspace;
