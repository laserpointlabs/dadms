# BPMN Model Cache Implementation Documentation

## Overview

This document describes the implementation of browser-based caching for BPMN model persistence in the React BPMN Workspace component. The cache system automatically saves and restores BPMN models across browser sessions, providing seamless user experience without data loss.

## Architecture

### Key Components

1. **Model Storage**: Uses browser `localStorage` to persist BPMN XML data
2. **Timestamp Management**: Tracks cache age for automatic expiry
3. **Property Cache**: Maintains extension properties separate from BPMN XML
4. **Auto-save System**: Automatically triggers on model changes
5. **Cache Validation**: Implements 24-hour expiry mechanism

## Implementation Details

### Core Cache Functions

#### 1. Save Model to Cache
```typescript
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
```

**Key Features:**
- Accepts optional modeler instance parameter for event listeners
- Checks cache enabled state before saving
- Stores formatted XML for readability
- Records timestamp for expiry tracking
- Handles errors gracefully

#### 2. Load Model from Cache
```typescript
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
```

**Key Features:**
- Simple function (not React useCallback) to avoid dependency issues
- Automatic expiry after 24 hours
- Self-cleaning expired cache
- Detailed logging for debugging
- Returns null if no valid cache exists

#### 3. Clear Model Cache
```typescript
const clearModelCache = () => {
    localStorage.removeItem('bpmn_model_cache');
    localStorage.removeItem('bpmn_model_timestamp');
    console.log('Model cache cleared');
};
```

**Key Features:**
- Removes both XML and timestamp
- Used by "Clear All" functionality
- Simple and reliable cleanup

### Extension Property Cache

#### Property Extraction
```typescript
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
```

**Key Features:**
- Parses XML to extract extension properties
- Focuses on service tasks and Camunda properties
- Creates in-memory cache for quick access
- Handles parsing errors gracefully
- Supports namespace variations

## Auto-Save Implementation

### Event Listeners
The cache system automatically saves on these events:

```typescript
// User interactions
modelerInstance.on('element.click', (event: any) => {
    setSelectedElement(event.element);
    saveModelToCache(modelerInstance);
});

// Model changes
modelerInstance.on('commandStack.changed', () => {
    saveModelToCache(modelerInstance);
});

modelerInstance.on('element.changed', () => {
    saveModelToCache(modelerInstance);
});
```

**Trigger Events:**
- **element.click**: User selects elements
- **commandStack.changed**: Undo/redo operations, element creation/deletion
- **element.changed**: Property modifications, moves, resizes
- **Manual saves**: Property updates through UI

### Initialization Process

```typescript
// Initialize BPMN modeler
useEffect(() => {
    const initModeler = async () => {
        try {
            // Create modeler instance
            const modelerInstance = new BpmnModeler({
                container: canvasRef.current,
                keyboard: { bindTo: window }
            });

            // Try to load from cache first
            const cachedXML = loadModelFromCache();
            let xmlToLoad = emptyXML;
            
            if (cachedXML) {
                xmlToLoad = cachedXML;
                console.log('Found cached model, loading...');
            } else {
                console.log('No cached model found, using empty XML');
            }

            // Import XML (cached or empty)
            await modelerInstance.importXML(xmlToLoad);
            setModeler(modelerInstance);

            // Initialize property cache from loaded XML
            if (cachedXML) {
                extractAndCacheExtensionProperties(modelerInstance, xmlToLoad);
            }

            // Set up event listeners for auto-save
            // ... event listener setup
        } catch (error) {
            console.error('Modeler initialization error:', error);
        }
    };

    initModeler();
}, []); // Empty dependency array prevents re-initialization
```

## Storage Structure

### localStorage Keys
- **bpmn_model_cache**: Contains the BPMN XML string
- **bpmn_model_timestamp**: Unix timestamp of last save

### Data Format
```json
{
  "bpmn_model_cache": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<bpmn:definitions...>",
  "bpmn_model_timestamp": "1703588400000"
}
```

## Cache Lifecycle

### 1. Initial Load
1. Check localStorage for existing cache
2. Validate cache age (< 24 hours)
3. Load cached XML or use empty template
4. Extract extension properties if cache exists
5. Initialize BPMN modeler with loaded data

### 2. Runtime Operations
1. User makes changes to BPMN model
2. Event listeners detect changes
3. Auto-save triggers `saveModelToCache()`
4. XML and timestamp stored in localStorage
5. Property cache updated in memory

### 3. Cache Expiry
1. On next load, check timestamp age
2. If > 24 hours, automatically clear cache
3. Log expiry and start with empty model
4. Continue normal operation

### 4. Manual Clear
1. User clicks "Clear All" button
2. Confirmation dialog appears
3. If confirmed, clear BPMN model and cache
4. Reset to empty state

## Error Handling

### Save Errors
```typescript
.catch((error: any) => {
    console.error('Error saving model to cache:', error);
});
```

### Load Errors
- Invalid XML: Falls back to empty template
- Missing timestamp: Treats as expired
- Parse errors: Logged and handled gracefully

### Property Cache Errors
```typescript
} catch (error) {
    console.error('Error extracting properties for cache:', error);
}
```

## Performance Considerations

### Optimization Strategies
1. **Formatted XML**: Stored with formatting for debugging
2. **Event Debouncing**: Could be added for high-frequency changes
3. **Selective Caching**: Only service tasks properties cached
4. **Memory Management**: Property cache cleared on model clear

### Storage Limits
- localStorage typically 5-10MB per domain
- BPMN XML usually < 100KB for complex models
- Property cache minimal overhead
- Automatic cleanup prevents accumulation

## Configuration Options

### Cache Control
```typescript
const [cacheEnabled, setCacheEnabled] = useState(true);
```

### Cache Expiry
```typescript
const maxAge = 24 * 60 * 60 * 1000; // 24 hours (configurable)
```

### UI Indicators
```typescript
{cacheEnabled && (
    <span style={{ marginLeft: '20px', color: '#28a745' }}>
        📁 Cache Enabled (24h auto-expire)
    </span>
)}
```

## Troubleshooting

### Common Issues
1. **Cache not loading**: Check browser console for errors
2. **Performance issues**: Consider debouncing auto-save
3. **Storage quota**: Monitor localStorage usage
4. **Cross-tab sync**: localStorage events could be added

### Debug Commands
```javascript
// Check cache contents
localStorage.getItem('bpmn_model_cache');
localStorage.getItem('bpmn_model_timestamp');

// Clear cache manually
localStorage.removeItem('bpmn_model_cache');
localStorage.removeItem('bpmn_model_timestamp');

// Check cache age
const timestamp = localStorage.getItem('bpmn_model_timestamp');
const age = Date.now() - parseInt(timestamp);
console.log('Cache age:', age / 1000 / 60, 'minutes');
```

## Future Enhancements

### Potential Improvements
1. **IndexedDB Support**: For larger models
2. **Compression**: Reduce storage footprint
3. **Multiple Models**: Support for project-based caching
4. **Cloud Sync**: Integration with backend storage
5. **Version History**: Track model changes over time
6. **Cross-tab Sync**: Real-time updates across browser tabs

## Conclusion

The BPMN model cache implementation provides robust, automatic persistence of user work using browser localStorage. The system is designed to be transparent to users while providing reliable data recovery across browser sessions. The 24-hour expiry ensures data freshness while the auto-save functionality prevents data loss during modeling sessions.

The implementation balances simplicity with functionality, avoiding complex state management issues while providing comprehensive caching of both BPMN XML and extension properties.
