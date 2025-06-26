# BPMN.js Context Pad Icon and Popup Menu Visibility Fix

## Problem Description

When integrating BPMN.js into a React application, you may encounter issues where:
1. Context pad icons (connect, replace, delete, etc.) appear washed out or invisible
2. Popup menu text (when clicking the replace/wrench icon) is not visible
3. The icons and text have poor contrast against the background

This is a common CSS styling conflict between the React application's styles and BPMN.js default styles.

## Root Cause

The visibility issues are caused by:
- CSS inheritance and specificity conflicts
- Default color values being overridden by application CSS
- Font loading and rendering issues with the BPMN icon font
- Background color conflicts in popup menus

## Solution Overview

The fix involves three main steps:
1. Proper BPMN.js asset loading
2. Context pad icon visibility CSS fixes
3. Popup menu text visibility CSS fixes

## Step 1: Proper Asset Loading

### Load BPMN.js Assets in HTML Head

Instead of dynamically loading BPMN.js assets in JavaScript, load them directly in your HTML file to ensure proper loading order:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Other head content -->
    
    <!-- BPMN.js CSS - must be loaded first -->
    <link rel="stylesheet" href="https://unpkg.com/bpmn-js@17.11.1/dist/assets/diagram-js.css" />
    <link rel="stylesheet" href="https://unpkg.com/bpmn-js@17.11.1/dist/assets/bpmn-font/css/bpmn.css" />
    
    <title>Your App</title>
</head>
<body>
    <div id="root"></div>
    
    <!-- BPMN.js Library -->
    <script src="https://unpkg.com/bpmn-js@17.11.1/dist/bpmn-modeler.production.min.js"></script>
</body>
</html>
```

### Initialize BPMN Modeler in React

```typescript
useEffect(() => {
    const initModeler = async () => {
        try {
            // Check if BPMN.js library is available
            const BpmnModeler = (window as any).BpmnJS;
            if (!BpmnModeler) {
                console.error('BPMN.js library not loaded');
                return;
            }

            const modelerInstance = new BpmnModeler({
                container: canvasRef.current,
                keyboard: { bindTo: window }
            });

            await modelerInstance.importXML(emptyXML);
            setModeler(modelerInstance);
        } catch (error) {
            console.error('Modeler initialization error:', error);
        }
    };

    initModeler();
}, []);
```

## Step 2: Context Pad Icon Visibility Fix

Add the following CSS to force context pad icons to be visible:

```css
/* Force context pad icons to be visible - color fix */
.djs-context-pad .entry {
    background: white !important;
    border: 1px solid #ccc !important;
}

.djs-context-pad .entry:hover {
    background: #f0f0f0 !important;
}

.djs-context-pad .entry div {
    color: #333 !important;
    opacity: 1 !important;
}

/* Force icon font to be black/dark */
.djs-context-pad .entry:before,
.djs-palette .entry:before {
    color: #333 !important;
    opacity: 1 !important;
}

/* Target specific BPMN font icons */
[class*="bpmn-icon-"]:before {
    color: #333 !important;
    opacity: 1 !important;
}
```

## Step 3: Popup Menu Text Visibility Fix

Add comprehensive CSS to ensure all popup menu text is visible:

```css
/* Fix context pad popup menu text visibility */
.djs-context-pad .djs-popup {
    background: white !important;
    border: 1px solid #ccc !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

.djs-context-pad .djs-popup .entry {
    color: #333 !important;
    background: white !important;
}

.djs-context-pad .djs-popup .entry:hover {
    background: #f0f0f0 !important;
    color: #000 !important;
}

.djs-context-pad .djs-popup .entry .label {
    color: #333 !important;
}

.djs-context-pad .djs-popup .entry span {
    color: #333 !important;
}

/* Fix replace menu text */
.djs-popup-replace-menu {
    background: white !important;
    border: 1px solid #ccc !important;
}

.djs-popup-replace-menu .entry {
    color: #333 !important;
}

.djs-popup-replace-menu .entry:hover {
    background: #f0f0f0 !important;
    color: #000 !important;
}

.djs-popup-replace-menu .entry .label {
    color: #333 !important;
}

/* More comprehensive popup menu text fixes */
.djs-popup,
.djs-popup-body,
.djs-popup-content {
    background: white !important;
    color: #333 !important;
}

.djs-popup *,
.djs-popup-body *,
.djs-popup-content * {
    color: #333 !important;
}

/* All text in popup menus */
.djs-popup .entry div,
.djs-popup .entry span,
.djs-popup .entry p,
.djs-popup .entry label,
.djs-popup .entry .djs-label {
    color: #333 !important;
    text-shadow: none !important;
}

/* Replace menu specific */
.djs-popup-replace .entry,
.djs-popup-replace .entry div,
.djs-popup-replace .entry span {
    color: #333 !important;
    background: transparent !important;
}

/* Context menu entries */
.djs-context-pad .djs-popup .group,
.djs-context-pad .djs-popup .group .entry {
    color: #333 !important;
}

/* Generic popup text fix */
div[class*="popup"] {
    color: #333 !important;
}

div[class*="popup"] * {
    color: #333 !important;
}
```

## Step 4: Palette Icon Visibility (Bonus)

Also ensure the main palette icons are visible:

```css
/* Ensure bpmn.io palette is styled properly */
.djs-palette {
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    left: 20px !important;
    top: 20px !important;
}

.djs-palette .entry {
    border-radius: 3px;
}

.djs-palette .entry:hover {
    background: #e9ecef;
}

/* Ensure palette icons are visible */
.djs-palette .entry div {
    color: #333;
}

/* Remove conflicting palette styles */
.canvas-container .djs-palette {
    position: absolute;
    z-index: 100;
}
```

## Key CSS Principles

### 1. Use !important Sparingly but Effectively
The `!important` declarations are necessary because BPMN.js applies its own styles with high specificity. Use them only for the visibility fixes.

### 2. Target Multiple Selectors
Different BPMN.js versions and configurations may use different CSS class structures. The comprehensive approach targets multiple possible selectors.

### 3. Force Background and Text Colors
Explicitly set both background and text colors to ensure proper contrast:
- Background: `white` or `#f0f0f0` for hover
- Text: `#333` or `#000` for good contrast

### 4. Handle Font Icons Specifically
BPMN icons use a font-based icon system. Target the `:before` pseudo-elements and any elements with `bpmn-icon-` in their class name.

## Testing the Fix

After applying the CSS fixes, test the following:

1. **Context Pad Icons**: Click on any BPMN element and verify all context pad icons are clearly visible
2. **Replace Menu**: Click the wrench/replace icon and verify all text in the popup menu is readable
3. **Hover States**: Verify hover effects work properly for both icons and menu items
4. **Main Palette**: Verify the left-side palette icons are also visible

## Common Issues and Troubleshooting

### Icons Still Not Visible
- Check browser dev tools to see if BPMN font files are loading
- Verify CSS load order (BPMN CSS should load before your app CSS)
- Check for conflicting CSS rules with higher specificity

### Popup Text Still Invisible
- Inspect the popup element in dev tools to identify the exact CSS classes
- Add more specific selectors targeting those classes
- Check if the popup is using inline styles that override CSS

### Performance Considerations
- The comprehensive CSS approach uses many selectors, but the performance impact is minimal
- Consider reducing selectors if you know your specific BPMN.js configuration

## Version Compatibility

This fix has been tested with:
- BPMN.js v17.11.1
- React 18+
- Modern browsers (Chrome, Firefox, Safari, Edge)

For other versions, you may need to adjust the CSS selectors based on the actual DOM structure generated by your BPMN.js version.

## Complete Example

For a complete working example, see:
- `/home/jdehart/dadm/ui/src/components/BPMNWorkspace.tsx` - React component
- `/home/jdehart/dadm/ui/src/components/BPMNWorkspace.css` - Complete CSS with fixes
- `/home/jdehart/dadm/ui/public/index.html` - HTML with proper asset loading
