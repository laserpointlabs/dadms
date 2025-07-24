# Persistent Panel States - DADMS 2.0

## Overview

The DADMS 2.0 application implements persistent collapsible panel states that maintain their expanded/collapsed status across browser sessions. This feature enhances user experience by remembering panel layouts and reducing the need to reconfigure the interface on each visit.

## Architecture

### Core Components

- **PanelStateContext**: Central state management using React Context API
- **PanelStateProvider**: Provider component that wraps the application
- **usePanelState**: Hook for accessing panel state management functions
- **usePanel**: Convenience hook for individual panel state management
- **localStorage**: Client-side persistence layer

### State Structure

```typescript
interface PanelState {
    isCollapsed: boolean;
    isOpen: boolean;
}

interface PanelStates {
    [panelId: string]: PanelState;
}
```

## Implementation Details

### 1. Context Provider (`src/contexts/PanelStateContext.tsx`)

The context provides centralized state management with performance optimizations:

```typescript
export const PanelStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [panelStates, setPanelStates] = useState<PanelStates>(DEFAULT_PANEL_STATES);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load states from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsedStates = JSON.parse(stored);
                setPanelStates({ ...DEFAULT_PANEL_STATES, ...parsedStates });
            }
            setIsInitialized(true);
        } catch (error) {
            console.warn('Failed to load panel states from localStorage:', error);
            setIsInitialized(true);
        }
    }, []);

    // Save states to localStorage when they change
    useEffect(() => {
        if (isInitialized) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(panelStates));
            } catch (error) {
                console.warn('Failed to save panel states to localStorage:', error);
            }
        }
    }, [panelStates, isInitialized]);

    // Memoized functions to prevent unnecessary re-renders
    const getPanelState = useCallback((panelId: string): PanelState => {
        return panelStates[panelId] || { isCollapsed: false, isOpen: true };
    }, [panelStates]);

    const togglePanelCollapsed = useCallback((panelId: string) => {
        const currentState = getPanelState(panelId);
        setPanelCollapsed(panelId, !currentState.isCollapsed);
    }, [getPanelState, setPanelCollapsed]);

    // ... other functions

    return (
        <PanelStateContext.Provider value={contextValue}>
            {children}
        </PanelStateContext.Provider>
    );
};
```

### 2. Application Integration (`src/app/layout.tsx`)

The provider is integrated at the root level:

```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <ThemeProvider defaultTheme="dark">
                    <PanelStateProvider>
                        <TabProvider>
                            <AgentAssistantProvider>
                                <MainLayout>
                                    {children}
                                </MainLayout>
                                <AASCar />
                            </AgentAssistantProvider>
                        </TabProvider>
                    </PanelStateProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
```

### 3. Component Usage

#### Direct Context Usage (Recommended)

```typescript
function SidebarView({ activeView }: { activeView: string }) {
    const { getPanelState, togglePanelCollapsed } = usePanelState();
    const sidebarState = getPanelState('project-explorer');
    
    switch (activeView) {
        case 'explorer':
            return (
                <ExplorerView 
                    isCollapsed={sidebarState.isCollapsed} 
                    onToggleCollapse={() => togglePanelCollapsed('project-explorer')} 
                />
            );
        // ... other cases
    }
}
```

#### Using the usePanel Hook

```typescript
function OntologyModeler() {
    const customGroup = usePanel('relationship-custom');
    const decisionGroup = usePanel('relationship-decision');
    
    return (
        <div>
            <button onClick={() => customGroup.toggleCollapsed()}>
                {customGroup.isCollapsed ? 'Expand' : 'Collapse'} Custom
            </button>
        </div>
    );
}
```

## Panel IDs

The following panel IDs are pre-configured:

### Project Explorer Panels
- `project-explorer`: Main sidebar panel
- `project-tree`: Project tree view

### Ontology Workspace Panels
- `ontology-explorer`: Ontology structure explorer
- `ontology-palette`: Ontology elements palette
- `ontology-properties`: Properties panel
- `ontology-references`: External references panel

### Relationship Selector Groups
- `relationship-custom`: Custom relationship types
- `relationship-decision`: Decision intelligence relationships
- `relationship-organizational`: Organizational relationships
- `relationship-basic`: Basic relationship types

## Storage Mechanism

### localStorage Key
- **Key**: `dadms-panel-states`
- **Format**: JSON string containing panel state objects
- **Persistence**: Survives browser restarts and tab refreshes

### Default States
```typescript
const DEFAULT_PANEL_STATES: PanelStates = {
    'project-explorer': { isCollapsed: false, isOpen: true },
    'project-tree': { isCollapsed: false, isOpen: true },
    'ontology-explorer': { isCollapsed: false, isOpen: true },
    'ontology-palette': { isCollapsed: false, isOpen: true },
    'ontology-properties': { isCollapsed: false, isOpen: true },
    'ontology-references': { isCollapsed: false, isOpen: true },
    'relationship-custom': { isCollapsed: true, isOpen: true },
    'relationship-decision': { isCollapsed: false, isOpen: true },
    'relationship-organizational': { isCollapsed: true, isOpen: true },
    'relationship-basic': { isCollapsed: true, isOpen: true },
};
```

## API Reference

### usePanelState Hook

Returns the panel state context with the following functions:

```typescript
interface PanelStateContextType {
    getPanelState: (panelId: string) => PanelState;
    setPanelCollapsed: (panelId: string, isCollapsed: boolean) => void;
    setPanelOpen: (panelId: string, isOpen: boolean) => void;
    togglePanelCollapsed: (panelId: string) => void;
    togglePanelOpen: (panelId: string) => void;
    resetPanelStates: () => void;
}
```

### usePanel Hook

Returns panel-specific state and functions:

```typescript
interface PanelHookReturn {
    isCollapsed: boolean;
    isOpen: boolean;
    setCollapsed: (collapsed: boolean) => void;
    setOpen: (open: boolean) => void;
    toggleCollapsed: () => void;
    toggleOpen: () => void;
}
```

## Implementation Examples

### 1. Basic Panel Toggle

```typescript
function MyComponent() {
    const { getPanelState, togglePanelCollapsed } = usePanelState();
    const panelState = getPanelState('my-panel');
    
    return (
        <div>
            <button onClick={() => togglePanelCollapsed('my-panel')}>
                {panelState.isCollapsed ? 'Expand' : 'Collapse'}
            </button>
            {!panelState.isCollapsed && (
                <div>Panel content</div>
            )}
        </div>
    );
}
```

### 2. Using the usePanel Hook

```typescript
function MyComponent() {
    const panel = usePanel('my-panel');
    
    return (
        <div>
            <button onClick={panel.toggleCollapsed}>
                {panel.isCollapsed ? 'Expand' : 'Collapse'}
            </button>
            {!panel.isCollapsed && (
                <div>Panel content</div>
            )}
        </div>
    );
}
```

### 3. Reusable Collapsible Panel Component

```typescript
interface CollapsiblePanelProps {
    panelId: string;
    title: string;
    icon?: string;
    children: React.ReactNode;
    className?: string;
    defaultCollapsed?: boolean;
    showToggleButton?: boolean;
    onToggle?: () => void;
}

export const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
    panelId,
    title,
    icon,
    children,
    className,
    defaultCollapsed,
    showToggleButton = true,
    onToggle
}) => {
    const panel = usePanel(panelId);
    
    // Initialize with default state if not already set
    React.useEffect(() => {
        if (defaultCollapsed !== undefined && !panel.isCollapsed === defaultCollapsed) {
            panel.setCollapsed(defaultCollapsed);
        }
    }, [defaultCollapsed, panel]);
    
    return (
        <div className={`collapsible-panel ${className || ''}`}>
            <div className="collapsible-panel-header">
                <button
                    className="toggle-button"
                    onClick={panel.toggleCollapsed}
                    title={panel.isCollapsed ? "Expand panel" : "Collapse panel"}
                >
                    <Icon 
                        name={panel.isCollapsed ? "chevron-right" : "chevron-down"} 
                        size="sm" 
                        className="toggle-icon"
                    />
                </button>
                {icon && <Icon name={icon} size="sm" className="panel-icon" />}
                <span className="panel-title">{title}</span>
            </div>
            {!panel.isCollapsed && (
                <div className="collapsible-panel-content">
                    {children}
                </div>
            )}
        </div>
    );
};
```

## Testing

### Test Page

A dedicated test page is available at `/test-panels` to verify the functionality:

```typescript
export default function TestPanelsPage() {
    const { resetPanelStates } = usePanelState();
    
    return (
        <PageLayout>
            <div className="space-y-4">
                <h2>Test Persistent Panel States</h2>
                <p>
                    This page demonstrates the persistent collapsible panel functionality.
                    Try collapsing and expanding panels, then refresh the page to see that
                    the states are preserved.
                </p>
                <button onClick={resetPanelStates}>
                    Reset All Panel States
                </button>
                
                <CollapsiblePanel panelId="test-panel-1" title="Test Panel 1">
                    <p>This is test panel 1 content.</p>
                </CollapsiblePanel>
                
                <CollapsiblePanel panelId="test-panel-2" title="Test Panel 2" defaultCollapsed={true}>
                    <p>This is test panel 2 content.</p>
                </CollapsiblePanel>
            </div>
        </PageLayout>
    );
}
```

### Manual Testing Steps

1. **Start the development server**: `npm run dev -- --port=9999`
2. **Navigate to the test page**: `http://localhost:9999/test-panels`
3. **Test panel collapse/expand**: Click panel headers to toggle states
4. **Test persistence**: Refresh the browser and verify states are preserved
5. **Test reset functionality**: Click "Reset All Panel States" button
6. **Test in actual components**: Navigate to Ontology Modeler and test real panels

## Migration Guide

### From Local State to Persistent State

**Before (Local State)**:
```typescript
function MyComponent() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    return (
        <div>
            <button onClick={() => setIsCollapsed(!isCollapsed)}>
                {isCollapsed ? 'Expand' : 'Collapse'}
            </button>
            {!isCollapsed && <div>Content</div>}
        </div>
    );
}
```

**After (Persistent State)**:
```typescript
function MyComponent() {
    const { getPanelState, togglePanelCollapsed } = usePanelState();
    const panelState = getPanelState('my-panel');
    
    return (
        <div>
            <button onClick={() => togglePanelCollapsed('my-panel')}>
                {panelState.isCollapsed ? 'Expand' : 'Collapse'}
            </button>
            {!panelState.isCollapsed && <div>Content</div>}
        </div>
    );
}
```

### Adding New Panels

1. **Define the panel ID** in `DEFAULT_PANEL_STATES`
2. **Use the panel** in your component with `usePanel(panelId)` or direct context functions
3. **Test the persistence** by toggling and refreshing

## Best Practices

### 1. Performance Optimization
- Use `useCallback` for state update functions to prevent unnecessary re-renders
- Use `useMemo` for context values to optimize provider performance
- Implement proper dependency arrays in hooks

### 2. Error Handling
- Wrap localStorage operations in try-catch blocks
- Provide fallback states when localStorage is unavailable
- Log warnings for debugging without breaking functionality

### 3. Type Safety
- Use TypeScript interfaces for all state structures
- Provide proper type definitions for hooks and functions
- Use strict typing for panel IDs

### 4. User Experience
- Provide visual feedback for panel state changes
- Use consistent icons and animations
- Maintain accessibility with proper ARIA labels

### 5. Testing
- Test persistence across browser sessions
- Test with localStorage disabled
- Test with corrupted localStorage data
- Test panel state conflicts and edge cases

## Troubleshooting

### Common Issues

1. **"usePanelState must be used within a PanelStateProvider"**
   - Ensure the component is wrapped with `PanelStateProvider`
   - Check that the provider is imported and used correctly

2. **Panel states not persisting**
   - Check browser localStorage support
   - Verify the storage key is correct
   - Check for localStorage quota exceeded errors

3. **Performance issues**
   - Ensure functions are properly memoized
   - Check for unnecessary re-renders
   - Verify context value is memoized

4. **Type errors**
   - Ensure all TypeScript interfaces are properly defined
   - Check import statements for correct types
   - Verify panel IDs match the defined types

### Debug Tools

```typescript
// Debug panel states
const { getPanelState } = usePanelState();
console.log('All panel states:', Object.keys(getPanelState).map(id => ({
    id,
    state: getPanelState(id)
})));

// Check localStorage
console.log('Stored panel states:', localStorage.getItem('dadms-panel-states'));
```

## Future Enhancements

### Planned Features
- **Server-side persistence**: Sync panel states across devices
- **User preferences**: Allow users to customize default panel states
- **Panel groups**: Group related panels for coordinated collapse/expand
- **Keyboard shortcuts**: Add keyboard navigation for panel management
- **Panel layouts**: Save and restore complete panel layouts

### Performance Improvements
- **Lazy loading**: Load panel states on demand
- **Compression**: Compress localStorage data for large state objects
- **Caching**: Implement intelligent caching strategies
- **Virtualization**: Support for large numbers of panels

## Conclusion

The persistent panel states implementation provides a robust, performant, and user-friendly solution for maintaining UI state across browser sessions. The architecture follows React best practices and provides a solid foundation for future enhancements.

The implementation is production-ready and has been tested across multiple scenarios, ensuring reliable functionality for DADMS 2.0 users. 