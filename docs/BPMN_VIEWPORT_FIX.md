# BPMN Workspace Viewport Fix

## Problem
The BPMN modeling workspace was overflowing the browser viewport within the DADM Material-UI application shell, causing vertical scrolling to be required to access the bottom toolbar. This made the workspace difficult to use as users had to scroll down to access critical functionality.

## Root Cause
The Material-UI application shell introduces additional height elements that were not accounted for in the workspace layout:
- **AppBar height**: 64px (standard Material-UI AppBar height)
- **Container padding**: 48px total (24px top + 24px bottom padding)

The original workspace CSS used `height: 100vh` and `max-height: 100vh`, which did not account for these shell elements, causing the workspace to exceed the visible viewport height.

## Solution
Updated the `.bpmn-workspace` CSS to use calculated height that subtracts the Material-UI shell elements:

```css
.bpmn-workspace {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 64px - 48px);
    /* Subtract AppBar height (64px) and container padding (24px * 2) */
    max-height: calc(100vh - 64px - 48px);
    overflow: hidden;
    background-color: #f8f9fa;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

### Calculation Breakdown
- **Total viewport height**: `100vh`
- **Material-UI AppBar**: `-64px`
- **Container padding**: `-48px` (24px top + 24px bottom)
- **Final workspace height**: `calc(100vh - 64px - 48px)`

## Implementation Details

### Files Modified
- `/home/jdehart/dadm/ui/src/components/BPMNWorkspace.css` - Updated `.bpmn-workspace` height calculations

### Layout Architecture
The workspace uses a flexbox layout structure:
1. **Workspace container** (`.bpmn-workspace`): Flex column with calculated height
2. **Header section** (`.workspace-header`): Fixed height with flex-shrink: 0
3. **Content area** (`.workspace-content`): Flex: 1 to fill remaining space
4. **Bottom toolbar** (`.bottom-toolbar`): Fixed height, always visible

### Key CSS Properties
- `display: flex` and `flex-direction: column` for vertical layout
- `overflow: hidden` to prevent scrolling within the workspace
- `flex: 1` on content area to fill available space
- Calculated height to fit within Material-UI shell

## Benefits
- **No vertical scrolling**: Workspace fits perfectly within visible viewport
- **Always accessible toolbar**: Bottom toolbar remains visible without scrolling
- **Responsive design**: Layout adapts to different screen sizes while maintaining viewport fit
- **Consistent experience**: Works seamlessly within DADM Material-UI application shell

## Testing
- Verified in browser that workspace fits viewport without overflow
- Confirmed bottom toolbar is always accessible
- Tested resizable panels work correctly within constrained height
- Validated on different screen sizes

## Future Considerations
- If Material-UI AppBar height changes, update the 64px value
- If container padding is modified, adjust the 48px value accordingly
- Monitor for Material-UI theme updates that might affect shell dimensions

## Related Documentation
- [BPMN Context Pad Visibility Fix](./BPMN_CONTEXT_PAD_VISIBILITY_FIX.md)
- [BPMN Model Cache Implementation](./BPMN_MODEL_CACHE_IMPLEMENTATION.md)
- [BPMN Viewer Implementation Solution](./BPMN_VIEWER_IMPLEMENTATION_SOLUTION.md)
