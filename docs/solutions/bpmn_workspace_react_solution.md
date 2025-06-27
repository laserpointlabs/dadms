# BPMN Workspace React Solution

## Overview
This document describes the working solution for a React-based BPMN workspace that ensures:
- Full sync between the diagram, properties panel, and XML.
- Persistent model state (including process name, id, documentation, executable, and service task properties) across browser refreshes.
- Reliable cache clearing and model reset.
- Modern, maintainable React/TypeScript code structure.

## Key Implementation Points

### 1. Model Initialization and Caching
- On load, the modeler imports from cache if available, otherwise from a default XML string (`emptyXML`).
- After every change (property, diagram, or XML), the model is saved to cache with injected extension properties.
- Clearing the model resets the cache and loads the default XML.

### 2. Properties Panel Sync
- The properties panel always reflects the current process or selected element.
- All process properties (name, id, documentation, executable) are extracted from the model after import and after every change.
- The default model includes a `<bpmn:documentation>` element for editability.

### 3. XML Panel
- The XML panel always shows the latest XML with injected extension properties.
- The XML is never editable directly (review only).

### 4. Service Task Properties
- Service Task extension properties are injected into the XML and persisted in the cache.
- Editing these properties updates the model, XML, and cache.

### 5. UI/UX
- Includes a clear model button, keyboard shortcuts, and resizable panels.
- All changes are persistent and reflected immediately in the UI and XML.

## Lessons Learned
- Always extract properties from the modeler instance after import or change, not from possibly stale React state.
- Save to cache after every change, using the injected XML.
- Include all editable fields in the default model XML.

## Next Steps
- Continue documenting solutions for other workspace features as they are stabilized.

---

*This document is part of the `/docs/solutions` folder for persistent solution tracking.*
