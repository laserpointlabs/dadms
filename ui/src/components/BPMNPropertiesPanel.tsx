import React, { useCallback, useEffect, useRef, useState } from 'react';
import './BPMNPropertiesPanel.css';

interface BPMNElement {
    id: string;
    type: string;
    name?: string;
    businessObject?: any;
}

interface ImplementationProperties {
    type?: string;
    topic?: string;
}

interface ExtensionProperties {
    'service.type'?: string;
    'service.name'?: string;
    'service.version'?: string;
}

interface BPMNPropertiesPanelProps {
    selectedElement: BPMNElement | null;
    onPropertyChange: (elementId: string, propertyPath: string, value: string) => void;
    modeler: any;
    onModelChange?: (xml: string) => void;
}

const BPMNPropertiesPanel: React.FC<BPMNPropertiesPanelProps> = ({
    selectedElement,
    onPropertyChange,
    modeler,
    onModelChange
}) => {
    // Local state for input values - these don't trigger model updates
    const [inputValues, setInputValues] = useState({
        name: '',
        id: '',
        documentation: '',
        implementation: {
            type: '',
            topic: ''
        } as ImplementationProperties,
        extensions: {
            'service.type': '',
            'service.name': '',
            'service.version': ''
        } as ExtensionProperties
    });

    // Track which field is currently being edited
    const [editingField, setEditingField] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Track if component is mounted
    const isMountedRef = useRef(true);

    // Load element properties when selected element changes
    useEffect(() => {
        if (!selectedElement || !modeler) {
            return;
        }

        console.log('loadElementProperties called for element:', selectedElement);

        try {
            const businessObject = selectedElement.businessObject;
            console.log('Business object:', businessObject);

            if (!businessObject) {
                console.warn('No business object found for selected element');
                return;
            }

            // Extract properties from the business object
            const name = businessObject.name || '';
            const id = businessObject.id || '';

            // Extract documentation
            const documentation = businessObject.documentation?.[0]?.text || '';

            // Extract implementation properties
            const implementationType = businessObject.implementation || '';
            const implementationTopic = businessObject.get('camunda:topic') || '';

            // Extract extension properties
            const extensionElements = businessObject.get('extensionElements');
            const properties = extensionElements?.get('camunda:properties');
            const serviceType = properties?.find((prop: any) => prop.get('name') === 'service.type')?.get('value') || '';
            const serviceName = properties?.find((prop: any) => prop.get('name') === 'service.name')?.get('value') || '';
            const serviceVersion = properties?.find((prop: any) => prop.get('name') === 'service.version')?.get('value') || '';

            const newInputValues = {
                name,
                id,
                documentation,
                implementation: {
                    type: implementationType,
                    topic: implementationTopic
                },
                extensions: {
                    'service.type': serviceType,
                    'service.name': serviceName,
                    'service.version': serviceVersion
                }
            };

            console.log('Setting new input values:', newInputValues);
            setInputValues(newInputValues);
        } catch (error) {
            console.error('Error loading element properties:', error);
        }
    }, [selectedElement, modeler]);

    useEffect(() => {
        isMountedRef.current = true;
        console.log('BPMNPropertiesPanel: Component mounted');

        return () => {
            console.log('BPMNPropertiesPanel: Component unmounting');
            isMountedRef.current = false;
        };
    }, []);

    // Handle input change - only update local state
    const handleInputChange = (propertyPath: string, value: string) => {
        setInputValues(prev => {
            const newValues = { ...prev };
            const pathParts = propertyPath.split('.');
            let current: any = newValues;

            // Navigate to the parent object, creating intermediate objects if needed
            for (let i = 0; i < pathParts.length - 1; i++) {
                const key = pathParts[i];
                if (!current[key]) {
                    current[key] = {};
                }
                current = current[key];
            }

            // Set the final property
            const finalKey = pathParts[pathParts.length - 1];
            current[finalKey] = value;

            return newValues;
        });
    };

    // Handle input focus
    const handleInputFocus = (propertyPath: string) => {
        setEditingField(propertyPath);
    };

    const updateDocumentation = useCallback((businessObject: any, value: string) => {
        try {
            const moddle = modeler.get('moddle');
            if (!moddle) {
                console.warn('Moddle not available for documentation update');
                return;
            }

            let documentation = businessObject.get('documentation');

            if (value.trim()) {
                if (!documentation || documentation.length === 0) {
                    const docElement = moddle.create('bpmn:Documentation');
                    docElement.set('text', value);
                    businessObject.set('documentation', [docElement]);
                } else {
                    documentation[0].set('text', value);
                }
            } else {
                businessObject.set('documentation', []);
            }
        } catch (error) {
            console.error('Error updating documentation:', error);
        }
    }, [modeler]);

    const updateImplementation = useCallback((businessObject: any, property: string, value: string) => {
        try {
            const modeling = modeler.get('modeling');
            if (!modeling) {
                console.warn('Modeling service not available for implementation update');
                return;
            }

            if (property === 'type') {
                modeling.updateProperties(selectedElement, { implementation: value });
            } else if (property === 'topic') {
                modeling.updateProperties(selectedElement, { 'camunda:topic': value });
            }
        } catch (error) {
            console.error('Error updating implementation:', error);
        }
    }, [modeler, selectedElement]);

    const updateExtensionProperty = useCallback((businessObject: any, propertyName: string, value: string) => {
        try {
            const moddle = modeler.get('moddle');
            if (!moddle) {
                console.warn('Moddle not available for extension property update');
                return;
            }

            let extensionElements = businessObject.get('extensionElements');
            if (!extensionElements) {
                extensionElements = moddle.create('bpmn:ExtensionElements');
                businessObject.set('extensionElements', extensionElements);
            }

            let properties = extensionElements.get('camunda:properties');
            if (!properties) {
                properties = moddle.create('camunda:Properties');
                extensionElements.set('camunda:properties', properties);
            }

            let property = properties.find((prop: any) => prop.get('name') === propertyName);

            if (value.trim()) {
                if (!property) {
                    property = moddle.create('camunda:Property');
                    property.set('name', propertyName);
                    properties.push(property);
                }
                property.set('value', value);
            } else {
                // Remove property if value is empty
                if (property) {
                    const index = properties.indexOf(property);
                    if (index > -1) {
                        properties.splice(index, 1);
                    }
                }
            }
        } catch (error) {
            console.error('Error updating extension property:', error);
        }
    }, [modeler]);

    // Handle input blur - update the model
    const handleInputBlur = useCallback((field: string) => {
        console.log('handleInputBlur called:', field);
        console.log('selectedElement:', selectedElement);
        console.log('modeler:', modeler);
        console.log('isUpdating:', isUpdating);
        console.log('isMountedRef.current:', isMountedRef.current);

        // Don't save if component is unmounted or not ready
        if (!isMountedRef.current || !modeler || !selectedElement || isUpdating) {
            console.log('handleInputBlur cancelled - not ready');
            return;
        }

        const modeling = modeler.get('modeling');
        if (!modeling) {
            console.log('handleInputBlur cancelled - no modeling service');
            return;
        }

        console.log('handleInputBlur proceeding with save for field:', field);
        setIsUpdating(true);

        try {
            const element = selectedElement.businessObject;
            let newValue: string = '';

            // Extract the correct value based on field path
            if (field === 'name' || field === 'id' || field === 'documentation') {
                newValue = inputValues[field] as string;
            } else if (field === 'implementation.type') {
                newValue = inputValues.implementation.type || '';
            } else if (field === 'implementation.topic') {
                newValue = inputValues.implementation.topic || '';
            } else if (field === 'extensions.service.type') {
                newValue = inputValues.extensions['service.type'] || '';
            } else if (field === 'extensions.service.name') {
                newValue = inputValues.extensions['service.name'] || '';
            } else if (field === 'extensions.service.version') {
                newValue = inputValues.extensions['service.version'] || '';
            }

            switch (field) {
                case 'name':
                    if (element.name !== newValue) {
                        console.log('Updating name from', element.name, 'to', newValue);
                        modeling.updateProperties(selectedElement, { name: newValue });
                    }
                    break;
                case 'id':
                    if (element.id !== newValue) {
                        console.log('Updating id from', element.id, 'to', newValue);
                        modeling.updateProperties(selectedElement, { id: newValue });
                    }
                    break;
                case 'documentation':
                    const currentDoc = element.documentation?.[0]?.text || '';
                    if (currentDoc !== newValue) {
                        console.log('Updating documentation from', currentDoc, 'to', newValue);
                        updateDocumentation(element, newValue);
                    }
                    break;
                case 'implementation.type':
                    const currentImplType = element.implementation || '';
                    if (currentImplType !== newValue) {
                        console.log('Updating implementation type from', currentImplType, 'to', newValue);
                        updateImplementation(element, 'type', newValue);
                    }
                    break;
                case 'implementation.topic':
                    const currentTopic = element.get('camunda:topic') || '';
                    if (currentTopic !== newValue) {
                        console.log('Updating implementation topic from', currentTopic, 'to', newValue);
                        updateImplementation(element, 'topic', newValue);
                    }
                    break;
                case 'extensions.service.type':
                    const currentServiceType = element.get('camunda:serviceType') || '';
                    if (currentServiceType !== newValue) {
                        console.log('Updating service type from', currentServiceType, 'to', newValue);
                        updateExtensionProperty(element, 'service.type', newValue);
                    }
                    break;
                case 'extensions.service.name':
                    const currentServiceName = element.get('camunda:serviceName') || '';
                    if (currentServiceName !== newValue) {
                        console.log('Updating service name from', currentServiceName, 'to', newValue);
                        updateExtensionProperty(element, 'service.name', newValue);
                    }
                    break;
                case 'extensions.service.version':
                    const currentServiceVersion = element.get('camunda:serviceVersion') || '';
                    if (currentServiceVersion !== newValue) {
                        console.log('Updating service version from', currentServiceVersion, 'to', newValue);
                        updateExtensionProperty(element, 'service.version', newValue);
                    }
                    break;
            }

            console.log('Property update completed for field:', field);
        } catch (error) {
            console.error('Error updating property:', error);
        } finally {
            // Only set isUpdating to false if component is still mounted
            if (isMountedRef.current) {
                setIsUpdating(false);
            }
        }
    }, [selectedElement, modeler, isUpdating, inputValues, updateDocumentation, updateImplementation, updateExtensionProperty]);

    if (!selectedElement) {
        return (
            <div className="bpmn-properties-panel">
                <div className="properties-header">
                    <h3>Properties</h3>
                </div>
                <div className="properties-content">
                    <div className="no-selection">
                        <p>Select a BPMN element to edit its properties</p>
                    </div>
                </div>
            </div>
        );
    }

    const isProcess = selectedElement.businessObject?.$type === 'bpmn:Process';

    return (
        <div className="bpmn-properties-panel">
            <div className="properties-header">
                <h3>Properties</h3>
                <div className="element-info">
                    <span className="element-type">
                        {isProcess ? 'Process Model' : selectedElement.type}
                    </span>
                    <span className="element-id">{selectedElement.id}</span>
                    {isUpdating && <span className="editing-indicator">Saving...</span>}
                    {editingField && <span className="editing-indicator">Editing...</span>}
                </div>
            </div>
            <div className="properties-content">
                <div className="property-group">
                    <h4>{isProcess ? 'Process Properties' : 'Basic Properties'}</h4>
                    <div className="property-field">
                        <label htmlFor="element-name">{isProcess ? 'Process Name' : 'Name'}</label>
                        <input
                            id="element-name"
                            type="text"
                            value={inputValues.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            onFocus={() => handleInputFocus('name')}
                            onBlur={() => handleInputBlur('name')}
                            placeholder={isProcess ? "Enter process name" : "Enter element name"}
                            disabled={isUpdating}
                        />
                    </div>
                    <div className="property-field">
                        <label htmlFor="element-id">{isProcess ? 'Process ID' : 'ID'}</label>
                        <input
                            id="element-id"
                            type="text"
                            value={inputValues.id}
                            onChange={(e) => handleInputChange('id', e.target.value)}
                            onFocus={() => handleInputFocus('id')}
                            onBlur={() => handleInputBlur('id')}
                            placeholder={isProcess ? "Enter process ID" : "Enter element ID"}
                            disabled={isUpdating}
                        />
                    </div>
                </div>

                <div className="property-group">
                    <h4>Documentation</h4>
                    <div className="property-field">
                        <label htmlFor="element-documentation">Description</label>
                        <textarea
                            id="element-documentation"
                            value={inputValues.documentation}
                            onChange={(e) => handleInputChange('documentation', e.target.value)}
                            onFocus={() => handleInputFocus('documentation')}
                            onBlur={() => handleInputBlur('documentation')}
                            placeholder="Enter description or documentation"
                            rows={4}
                            disabled={isUpdating}
                        />
                    </div>
                </div>

                {!isProcess && (
                    <>
                        <div className="property-group">
                            <h4>Implementation</h4>
                            <div className="property-field">
                                <label htmlFor="implementation-type">Type</label>
                                <select
                                    id="implementation-type"
                                    value={inputValues.implementation.type}
                                    onChange={(e) => handleInputChange('implementation.type', e.target.value)}
                                    onFocus={() => handleInputFocus('implementation.type')}
                                    onBlur={() => handleInputBlur('implementation.type')}
                                    disabled={isUpdating}
                                >
                                    <option value="">Select type</option>
                                    <option value="external">External</option>
                                    <option value="java">Java</option>
                                    <option value="expression">Expression</option>
                                    <option value="delegateExpression">Delegate Expression</option>
                                </select>
                            </div>
                            <div className="property-field">
                                <label htmlFor="implementation-topic">Topic</label>
                                <input
                                    id="implementation-topic"
                                    type="text"
                                    value={inputValues.implementation.topic}
                                    onChange={(e) => handleInputChange('implementation.topic', e.target.value)}
                                    onFocus={() => handleInputFocus('implementation.topic')}
                                    onBlur={() => handleInputBlur('implementation.topic')}
                                    placeholder="Enter topic name"
                                    disabled={isUpdating}
                                />
                            </div>
                        </div>

                        <div className="property-group">
                            <h4>Extension Properties</h4>
                            <div className="property-field">
                                <label htmlFor="service-type">Service Type</label>
                                <input
                                    id="service-type"
                                    type="text"
                                    value={inputValues.extensions['service.type']}
                                    onChange={(e) => handleInputChange('extensions.service.type', e.target.value)}
                                    onFocus={() => handleInputFocus('extensions.service.type')}
                                    onBlur={() => handleInputBlur('extensions.service.type')}
                                    placeholder="e.g., assistant"
                                    disabled={isUpdating}
                                />
                            </div>
                            <div className="property-field">
                                <label htmlFor="service-name">Service Name</label>
                                <input
                                    id="service-name"
                                    type="text"
                                    value={inputValues.extensions['service.name']}
                                    onChange={(e) => handleInputChange('extensions.service.name', e.target.value)}
                                    onFocus={() => handleInputFocus('extensions.service.name')}
                                    onBlur={() => handleInputBlur('extensions.service.name')}
                                    placeholder="e.g., dadm-openai-assistant"
                                    disabled={isUpdating}
                                />
                            </div>
                            <div className="property-field">
                                <label htmlFor="service-version">Service Version</label>
                                <input
                                    id="service-version"
                                    type="text"
                                    value={inputValues.extensions['service.version']}
                                    onChange={(e) => handleInputChange('extensions.service.version', e.target.value)}
                                    onFocus={() => handleInputFocus('extensions.service.version')}
                                    onBlur={() => handleInputBlur('extensions.service.version')}
                                    placeholder="e.g., 1.0"
                                    disabled={isUpdating}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default BPMNPropertiesPanel; 