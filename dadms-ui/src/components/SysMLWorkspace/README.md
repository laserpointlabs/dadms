# SysML v2 Modeler

A comprehensive SysML v2 modeling tool built for the DADMS platform, providing block definition diagrams (BDD) and internal block diagrams (IBD) with a custom HTML5 Canvas implementation.

## Components

### Core Components

- **SysMLWorkspace.tsx** - Main container component that orchestrates all panels and tools
- **SysMLModeler.tsx** - Custom HTML5 Canvas-based diagramming component ("Realflow")
- **DualViewEditor.tsx** - Dual-view editor with diagram and raw SysML v2 text editing
- **SysMLExplorer.tsx** - Hierarchical tree view for models and packages
- **SysMLPalette.tsx** - Draggable palette of SysML v2 elements
- **SysMLToolbar.tsx** - Toolbar with file operations, view controls, and validation
- **PropertiesPanel.tsx** - Properties editor for selected elements
- **store.ts** - Zustand state management for the entire workspace

## Features

### Diagramming
- **Custom Canvas Implementation**: Built on HTML5 Canvas instead of react-flow
- **Drag & Drop**: Nodes can be dragged around the canvas
- **Selection**: Click to select nodes and edges
- **Connection Mode**: Create connections between elements
- **Grid System**: Visual grid for alignment

### SysML v2 Elements
- **Structural**: Package, Block, Part, Attribute, Interface, Port
- **Behavioral**: Activity, State
- **Relationships**: Association, Composition, Aggregation, Generalization, Dependency, Realization, Flow
- **Other**: Constraint, Requirement, Note

### Dual View Editing
- **Diagram View**: Visual modeling with canvas
- **Text View**: Raw SysML v2 code editing with Monaco Editor
- **Synchronization**: Bidirectional sync between views
- **Syntax Highlighting**: SysML v2 syntax support

### Model Management
- **Hierarchical Structure**: Models organized in packages
- **Multiple Diagram Types**: BDD, IBD, Activity, State Machine, etc.
- **Properties Editing**: Comprehensive property panels
- **Validation**: Model validation with error reporting

## Usage

### Creating a New Model
1. Click "New" in the toolbar
2. Select diagram type (BDD, IBD, etc.)
3. Start adding elements from the palette

### Adding Elements
1. Drag elements from the palette to the canvas
2. Use the properties panel to configure element details
3. Create connections using connection mode

### Editing Properties
1. Select an element (node, edge, or model)
2. Use the properties panel to edit attributes
3. Changes are applied in real-time

### Switching Views
1. Use the dual-view editor to switch between diagram and text
2. Edit raw SysML v2 code in the text view
3. Synchronize changes between views

## Architecture

### State Management
- **Zustand Store**: Centralized state management
- **Type Safety**: Full TypeScript support
- **Immutability**: Immutable state updates

### Canvas Implementation
- **Custom Rendering**: Manual canvas drawing
- **Event Handling**: Mouse and keyboard interactions
- **Transformations**: Zoom, pan, and selection

### Integration
- **DADMS Theme**: Consistent with platform design
- **Panel System**: Collapsible panels with persistent state
- **Navigation**: Integrated with main DADMS navigation

## Development

### Adding New Elements
1. Add element type to `SysMLElementType` in store.ts
2. Update palette with new element
3. Add rendering logic in SysMLModeler
4. Update properties panel if needed

### Adding New Connection Types
1. Add connection type to `SysMLConnectionType` in store.ts
2. Update connection selector in SysMLModeler
3. Add rendering logic for connection arrows

### Customizing Canvas
- Modify `renderCanvas` function in SysMLModeler
- Add new interaction handlers
- Extend grid and selection systems

## Future Enhancements

- **Advanced Interactions**: Multi-select, group operations
- **Templates**: Pre-built diagram templates
- **Import/Export**: SysML v2 standard formats
- **Collaboration**: Real-time collaborative editing
- **Validation**: Advanced model validation rules
- **Simulation**: Model simulation capabilities
- **Documentation**: Auto-generated documentation
- **Version Control**: Model versioning and history

## Dependencies

- React 18+
- TypeScript
- Zustand (state management)
- Monaco Editor (text editing)
- DADMS Design System (theming)
- HTML5 Canvas API 