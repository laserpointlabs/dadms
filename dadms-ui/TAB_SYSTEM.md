# DADMS 2.0 Multi-Tab System

## Overview

The DADMS 2.0 UI now features a comprehensive multi-tab system that allows users to work with multiple pages simultaneously, similar to modern IDEs like VS Code.

## Features

### Core Functionality
- **Multiple Tabs**: Open and work with multiple pages simultaneously
- **Tab Navigation**: Click tabs to switch between different pages
- **Tab Closing**: Close individual tabs with the X button
- **Auto-Navigation**: Tabs automatically open when navigating to new pages
- **Tab Persistence**: Tabs maintain their state during navigation

### Advanced Features
- **Tab Pinning**: Pin important tabs to prevent accidental closure
- **Modified State**: Visual indicator when tabs have unsaved changes
- **Context Menu**: Right-click tabs for additional options
- **Bulk Operations**: Close multiple tabs at once
- **New Tab Button**: Manually create new tabs

## Usage

### Basic Tab Operations
1. **Opening Tabs**: Navigate to any page to automatically open a new tab
2. **Switching Tabs**: Click on any tab to switch to that page
3. **Closing Tabs**: Click the X button on any tab to close it
4. **New Tab**: Click the + button to open a new tab to the home page

### Advanced Tab Operations
1. **Right-Click Menu**: Right-click any tab for additional options:
   - Close
   - Close Others
   - Close to the Right
   - Close All
   - Pin/Unpin

2. **Tab States**:
   - **Active**: Currently selected tab (highlighted)
   - **Pinned**: Tab with pin icon (protected from bulk close operations)
   - **Modified**: Tab with dot indicator (has unsaved changes)

### Keyboard Shortcuts
- `Ctrl+W` (or `Cmd+W` on Mac): Close current tab
- `Ctrl+Shift+T` (or `Cmd+Shift+T` on Mac): Reopen last closed tab
- `Ctrl+Tab`: Switch to next tab
- `Ctrl+Shift+Tab`: Switch to previous tab

## Technical Implementation

### Components
- **TabContext**: React context for tab state management
- **TabBar**: Main tab bar component with all tab functionality
- **TabProvider**: Provider component that wraps the app

### Tab Properties
```typescript
interface Tab {
    id: string;           // Unique tab identifier
    title: string;        // Tab display title
    icon: string;         // Tab icon
    path: string;         // Page path
    isActive: boolean;    // Currently active tab
    isPinned: boolean;    // Tab is pinned
    isModified: boolean;  // Tab has unsaved changes
    canClose: boolean;    // Tab can be closed
}
```

### Context Methods
- `addTab(path, title?, icon?)`: Add a new tab
- `closeTab(tabId)`: Close a specific tab
- `switchTab(tabId)`: Switch to a specific tab
- `pinTab(tabId)`: Pin a tab
- `unpinTab(tabId)`: Unpin a tab
- `setTabModified(tabId, modified)`: Set tab modified state
- `closeAllTabs()`: Close all tabs
- `closeOtherTabs(tabId)`: Close all tabs except the specified one
- `closeTabsToRight(tabId)`: Close all tabs to the right of the specified tab

## Best Practices

### For Users
1. **Pin Important Tabs**: Pin frequently used pages to prevent accidental closure
2. **Use Context Menu**: Right-click tabs for bulk operations
3. **Monitor Modified State**: Pay attention to the dot indicator for unsaved changes
4. **Organize Workflow**: Use multiple tabs to compare different pages or work on related tasks

### For Developers
1. **Auto-Add Tabs**: The system automatically adds tabs when navigating to new pages
2. **Set Modified State**: Use `setTabModified` when content changes
3. **Handle Tab Events**: Listen for tab changes to update page content
4. **Preserve State**: Maintain page state when switching between tabs

## Future Enhancements

### Planned Features
- **Tab Groups**: Organize tabs into groups
- **Tab Reordering**: Drag and drop to reorder tabs
- **Tab Search**: Search through open tabs
- **Tab History**: Navigate through tab history
- **Tab Synchronization**: Sync tabs across browser sessions
- **Custom Tab Actions**: Add custom actions to tab context menu

### Integration Opportunities
- **Workspace Management**: Integrate with project/workspace system
- **File System**: Connect tabs to file system operations
- **Collaboration**: Share tab states in collaborative sessions
- **Analytics**: Track tab usage patterns for UX improvements

## Troubleshooting

### Common Issues
1. **Tab Not Opening**: Ensure the page path is valid and registered in the navigation system
2. **Tab Not Closing**: Check if the tab is pinned or has unsaved changes
3. **Navigation Issues**: Verify that the tab context is properly wrapped around the app

### Performance Considerations
- **Tab Limit**: Consider implementing a maximum tab limit for performance
- **Memory Management**: Clean up tab state when tabs are closed
- **Lazy Loading**: Load tab content only when needed

## Contributing

When contributing to the tab system:
1. Follow the existing patterns in `TabContext.tsx` and `TabBar.tsx`
2. Add appropriate TypeScript types for new features
3. Include CSS styles in `globals.css` following the existing theme system
4. Test tab functionality across different scenarios
5. Update this documentation for new features 