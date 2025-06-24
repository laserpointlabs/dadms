import React, { useEffect, useState } from 'react';
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
}

const BPMNPropertiesPanel: React.FC<BPMNPropertiesPanelProps> = ({
    selectedElement,
    onPropertyChange,
    modeler
}) => {
    const [properties, setProperties] = useState({
        name: '',
        id: '',
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

    // Update properties when selected element changes
    useEffect(() => {
        if (selectedElement && modeler) {
            const businessObject = selectedElement.businessObject;
            if (businessObject) {
                const newProperties = {
                    name: businessObject.name || '',
                    id: businessObject.id || '',
                    implementation: {
                        type: businessObject.get('camunda:type') || '',
                        topic: businessObject.get('camunda:topic') || ''
                    },
                    extensions: {
                        'service.type': getExtensionProperty(businessObject, 'service.type'),
                        'service.name': getExtensionProperty(businessObject, 'service.name'),
                        'service.version': getExtensionProperty(businessObject, 'service.version')
                    }
                };
                setProperties(newProperties);
            }
        } else {
            setProperties({
                name: '',
                id: '',
                implementation: { type: '', topic: '' },
                extensions: { 'service.type': '', 'service.name': '', 'service.version': '' }
            });
        }
    }, [selectedElement, modeler]);

    const getExtensionProperty = (businessObject: any, propertyName: string): string => {
        try {
            const extensionElements = businessObject.get('extensionElements');
            if (extensionElements) {
                const properties = extensionElements.get('camunda:properties');
                if (properties) {
                    const property = properties.find((prop: any) => prop.get('name') === propertyName);
                    return property ? property.get('value') : '';
                }
            }
        } catch (error) {
            console.warn('Error getting extension property:', error);
        }
        return '';
    };

    const handlePropertyChange = (propertyPath: string, value: string) => {
        if (!selectedElement) return;

        setProperties(prev => {
            const newProperties = { ...prev };
            const pathParts = propertyPath.split('.');
            let current: any = newProperties;

            for (let i = 0; i < pathParts.length - 1; i++) {
                current = current[pathParts[i]];
            }
            current[pathParts[pathParts.length - 1]] = value;

            return newProperties;
        });

        // Notify parent component
        onPropertyChange(selectedElement.id, propertyPath, value);
    };

    const updateBPMNElement = (propertyPath: string, value: string) => {
        if (!selectedElement || !modeler) return;

        try {
            const modeling = modeler.get('modeling');
            const businessObject = selectedElement.businessObject;

            if (propertyPath === 'name') {
                modeling.updateProperties(selectedElement, { name: value });
            } else if (propertyPath === 'id') {
                modeling.updateProperties(selectedElement, { id: value });
            } else if (propertyPath.startsWith('implementation.')) {
                const implProp = propertyPath.split('.')[1];
                if (implProp === 'type') {
                    modeling.updateProperties(selectedElement, { 'camunda:type': value });
                } else if (implProp === 'topic') {
                    modeling.updateProperties(selectedElement, { 'camunda:topic': value });
                }
            } else if (propertyPath.startsWith('extensions.')) {
                const extProp = propertyPath.split('.')[1];
                updateExtensionProperty(businessObject, extProp, value);
            }
        } catch (error) {
            console.error('Error updating BPMN element:', error);
        }
    };

    const updateExtensionProperty = (businessObject: any, propertyName: string, value: string) => {
        try {
            let extensionElements = businessObject.get('extensionElements');
            if (!extensionElements) {
                const moddle = modeler.get('moddle');
                extensionElements = moddle.create('bpmn:ExtensionElements');
                businessObject.set('extensionElements', extensionElements);
            }

            let properties = extensionElements.get('camunda:properties');
            if (!properties) {
                const moddle = modeler.get('moddle');
                properties = moddle.create('camunda:Properties');
                extensionElements.set('camunda:properties', properties);
            }

            // Find existing property or create new one
            let property = properties.find((prop: any) => prop.get('name') === propertyName);
            if (!property) {
                const moddle = modeler.get('moddle');
                property = moddle.create('camunda:Property');
                property.set('name', propertyName);
                properties.push(property);
            }
            property.set('value', value);
        } catch (error) {
            console.error('Error updating extension property:', error);
        }
    };

    const handleInputChange = (propertyPath: string, value: string) => {
        handlePropertyChange(propertyPath, value);
        updateBPMNElement(propertyPath, value);
    };

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

    return (
        <div className="bpmn-properties-panel">
            <div className="properties-header">
                <h3>Properties</h3>
                <div className="element-info">
                    <span className="element-type">{selectedElement.type}</span>
                    <span className="element-id">{selectedElement.id}</span>
                </div>
            </div>

            <div className="properties-content">
                <div className="property-group">
                    <h4>Basic Properties</h4>

                    <div className="property-field">
                        <label htmlFor="element-name">Name</label>
                        <input
                            id="element-name"
                            type="text"
                            value={properties.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="Enter element name"
                        />
                    </div>

                    <div className="property-field">
                        <label htmlFor="element-id">ID</label>
                        <input
                            id="element-id"
                            type="text"
                            value={properties.id}
                            onChange={(e) => handleInputChange('id', e.target.value)}
                            placeholder="Enter element ID"
                        />
                    </div>
                </div>

                <div className="property-group">
                    <h4>Implementation</h4>

                    <div className="property-field">
                        <label htmlFor="implementation-type">Type</label>
                        <select
                            id="implementation-type"
                            value={properties.implementation.type}
                            onChange={(e) => handleInputChange('implementation.type', e.target.value)}
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
                            value={properties.implementation.topic}
                            onChange={(e) => handleInputChange('implementation.topic', e.target.value)}
                            placeholder="Enter topic name"
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
                            value={properties.extensions['service.type']}
                            onChange={(e) => handleInputChange('extensions.service.type', e.target.value)}
                            placeholder="e.g., assistant"
                        />
                    </div>

                    <div className="property-field">
                        <label htmlFor="service-name">Service Name</label>
                        <input
                            id="service-name"
                            type="text"
                            value={properties.extensions['service.name']}
                            onChange={(e) => handleInputChange('extensions.service.name', e.target.value)}
                            placeholder="e.g., dadm-openai-assistant"
                        />
                    </div>

                    <div className="property-field">
                        <label htmlFor="service-version">Service Version</label>
                        <input
                            id="service-version"
                            type="text"
                            value={properties.extensions['service.version']}
                            onChange={(e) => handleInputChange('extensions.service.version', e.target.value)}
                            placeholder="e.g., 1.0"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BPMNPropertiesPanel; 