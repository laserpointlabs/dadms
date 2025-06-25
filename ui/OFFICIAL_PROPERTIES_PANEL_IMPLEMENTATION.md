# Official BPMN.js Properties Panel Implementation

## Overview

This document outlines the implementation of the official BPMN.js properties panel approach, which provides a robust, maintainable, and extensible solution for handling BPMN element properties.

## Architecture

The official properties panel approach consists of several key components:

### 1. **Moddle Extensions** (`service-extension.json`)
- Define custom BPMN properties in JSON format
- Extend existing BPMN elements with custom attributes
- Ensure proper XML serialization

### 2. **Properties Providers** (`service-properties-provider.js`)
- React components that render custom property fields
- Integrate with the official properties panel
- Handle property updates using BPMN.js modeling service

### 3. **BPMN Modeler Configuration**
- Initialize modeler with properties panel
- Register custom modules and extensions
- Configure moddle extensions

## Implementation Steps

### Step 1: Install Dependencies

```bash
npm install bpmn-js-properties-panel @bpmn-io/properties-panel
```

### Step 2: Create Moddle Extension

Create `service-extension.json`:

```json
{
  "name": "Service Extension",
  "uri": "http://example.com/service",
  "prefix": "service",
  "xml": {
    "tagAlias": "lowerCase"
  },
  "types": [
    {
      "name": "ServiceTask",
      "extends": ["bpmn:ServiceTask"],
      "properties": [
        {
          "name": "serviceType",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "serviceName",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "serviceVersion",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "serviceEndpoint",
          "isAttr": true,
          "type": "String"
        }
      ]
    }
  ]
}
```

### Step 3: Create Properties Provider

Create `service-properties-provider.js`:

```javascript
import { is } from 'bpmn-js/lib/util/ModelUtil';
import { TextFieldEntry } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';

export function ServiceTaskPropertiesProvider(props) {
  const { element } = props;

  if (!is(element, 'bpmn:ServiceTask')) {
    return null;
  }

  return <ServiceTaskProperties element={element} />;
}

function ServiceTaskProperties(props) {
  const { element } = props;
  const modeling = useService('modeling');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const getExtensionValue = (key) => {
    return element.businessObject.get(`service:${key}`) || '';
  };

  const setExtensionValue = (key, value) => {
    const attrs = { ...element.businessObject.$attrs };
    if (value && value.trim() !== '') {
      attrs[`service:${key}`] = value;
    } else {
      delete attrs[`service:${key}`];
    }
    modeling.updateProperties(element, { $attrs: attrs });
  };

  return (
    <div>
      <TextFieldEntry
        id="serviceType"
        label={translate('Service Type')}
        getValue={() => getExtensionValue('serviceType')}
        setValue={(value) => setExtensionValue('serviceType', value)}
        debounce={debounce}
      />
      <TextFieldEntry
        id="serviceName"
        label={translate('Service Name')}
        getValue={() => getExtensionValue('serviceName')}
        setValue={(value) => setExtensionValue('serviceName', value)}
        debounce={debounce}
      />
    </div>
  );
}
```

### Step 4: Configure BPMN Modeler

```javascript
import BpmnModeler from 'bpmn-js/lib/Modeler';
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel';
import { ServiceTaskPropertiesProvider } from './service-properties-provider';

const modeler = new BpmnModeler({
  container: '#canvas',
  propertiesPanel: {
    parent: '#properties-panel'
  },
  additionalModules: [
    BpmnPropertiesPanelModule,
    BpmnPropertiesProviderModule,
    {
      __init__: ['serviceTaskPropertiesProvider'],
      serviceTaskPropertiesProvider: ['type', ServiceTaskPropertiesProvider]
    }
  ],
  moddleExtensions: {
    service: require('./service-extension.json')
  }
});
```

## Key Benefits

### 1. **Proper XML Serialization**
- Custom properties are correctly serialized to XML
- Properties persist across model saves/loads
- Standard BPMN 2.0 compliance

### 2. **Type Safety**
- Properties are properly typed in the moddle
- Validation and constraints can be applied
- Better IDE support and debugging

### 3. **Extensibility**
- Easy to add new property types
- Modular architecture
- Reusable components

### 4. **Integration**
- Seamless integration with BPMN.js
- Consistent UI/UX
- Proper event handling

## Property Types Supported

### Service Tasks
- `service:serviceType` - Type of service (REST, SOAP, JAVA, etc.)
- `service:serviceName` - Name of the service
- `service:serviceVersion` - Version of the service
- `service:serviceEndpoint` - Endpoint URL

### Script Tasks
- `service:scriptLanguage` - Programming language
- `service:scriptVersion` - Script version
- `service:scriptTimeout` - Execution timeout

### User Tasks
- `service:assignee` - Task assignee
- `service:candidateGroups` - Candidate groups
- `service:candidateUsers` - Candidate users
- `service:dueDate` - Due date
- `service:priority` - Task priority

### Call Activities
- `service:calledElement` - Called element reference
- `service:calledElementBinding` - Binding type
- `service:calledElementVersion` - Version

## Usage Examples

### Creating a Service Task with Properties

```javascript
const modeling = modeler.get('modeling');
const elementFactory = modeler.get('elementFactory');

const serviceTask = elementFactory.createShape({
  type: 'bpmn:ServiceTask',
  id: 'ServiceTask_1',
  name: 'User Service'
});

// Add custom properties
modeling.updateProperties(serviceTask, {
  $attrs: {
    'service:serviceType': 'REST',
    'service:serviceName': 'UserService',
    'service:serviceVersion': '1.0',
    'service:serviceEndpoint': 'https://api.example.com/users'
  }
});
```

### Reading Properties

```javascript
const element = modeler.get('elementRegistry').get('ServiceTask_1');
const serviceType = element.businessObject.get('service:serviceType');
const serviceName = element.businessObject.get('service:serviceName');
```

## XML Output Example

```xml
<bpmn:serviceTask id="ServiceTask_1" 
                  name="User Service"
                  service:serviceType="REST"
                  service:serviceName="UserService"
                  service:serviceVersion="1.0"
                  service:serviceEndpoint="https://api.example.com/users">
  <!-- Task content -->
</bpmn:serviceTask>
```

## Migration from Custom Properties Panel

### Before (Custom Implementation)
```javascript
// Manual property updates
function updateProperty(element, propertyName, value) {
  const attrs = element.businessObject.$attrs || {};
  attrs[propertyName] = value;
  modeling.updateProperties(element, { $attrs: attrs });
}
```

### After (Official Implementation)
```javascript
// Type-safe property updates
function updateProperty(element, propertyName, value) {
  modeling.updateProperties(element, {
    [propertyName]: value
  });
}
```

## Best Practices

### 1. **Property Naming**
- Use consistent naming conventions
- Prefix custom properties with namespace
- Follow BPMN 2.0 standards

### 2. **Validation**
- Add validation rules in moddle extension
- Provide meaningful error messages
- Handle edge cases gracefully

### 3. **Performance**
- Use debouncing for text inputs
- Minimize re-renders
- Optimize property updates

### 4. **Testing**
- Test property serialization
- Verify XML output
- Test property validation

## Troubleshooting

### Common Issues

1. **Properties not saving to XML**
   - Check moddle extension configuration
   - Verify property names match
   - Ensure proper namespace prefix

2. **Properties not showing in panel**
   - Check properties provider registration
   - Verify element type matching
   - Check React component structure

3. **Type errors**
   - Verify moddle extension types
   - Check property definitions
   - Ensure proper imports

### Debug Tools

```javascript
// Debug modeler state
window.debugModeler = function() {
  console.log('Modeler:', modeler);
  console.log('Selected element:', selectedElement);
  if (selectedElement) {
    console.log('Business object:', selectedElement.businessObject);
    console.log('Attributes:', selectedElement.businessObject.$attrs);
  }
};

// Test property updates
window.testPropertyUpdate = function() {
  if (!selectedElement) return;
  updateBasicProperty('name', 'Test Update ' + Date.now());
};
```

## Conclusion

The official BPMN.js properties panel approach provides a robust, maintainable, and extensible solution for handling BPMN element properties. It ensures proper XML serialization, type safety, and seamless integration with the BPMN.js ecosystem.

By following this implementation guide, you can create a professional-grade BPMN modeler with custom properties that properly persist and integrate with the broader BPMN 2.0 ecosystem. 