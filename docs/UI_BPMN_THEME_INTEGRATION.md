# BPMN Modeler Dark Theme Integration

## Overview

The DADMS BPMN Workspace now includes comprehensive dark/light theme support that seamlessly integrates with the main DADMS UI theme system. The BPMN modeler automatically switches themes when the user changes the global theme in the main application.

## Features

### 🎨 **Automatic Theme Synchronization**
- The BPMN modeler automatically follows the parent application's theme
- Real-time theme switching without page refresh
- Smooth transitions with CSS animations

### 🌙 **Dark Theme Support**
- All UI components (menus, panels, toolbars) use dark theme colors
- BPMN elements are styled with proper contrast for dark backgrounds
- Code editor (XML view) adapts to dark theme
- All interactive elements (buttons, inputs, dropdowns) themed consistently

### ☀️ **Light Theme Support**
- Clean, professional light theme styling
- Proper contrast ratios for accessibility
- Consistent with DADMS design system

### 🔧 **Theme Components**

#### CSS Variables
The modeler uses the same CSS variables as the main DADMS UI:
```css
--theme-bg-primary: #1e1e1e (dark) / #ffffff (light)
--theme-text-primary: #d4d4d4 (dark) / #1f2328 (light)
--theme-accent-primary: #007acc (dark) / #0969da (light)
```

#### BPMN Element Styling
- **Shapes**: Use theme surface colors with proper borders
- **Text**: Adapts to theme text colors for readability
- **Connections**: Lines and arrows use theme border colors
- **Selection**: Highlighted elements use theme accent colors

## Implementation Details

### React Component Integration
```typescript
// BPMNModeler component automatically syncs with theme
import { BPMNModeler } from '@/components/BPMNWorkspace/BPMNModeler';

<BPMNModeler 
  height="calc(100vh - 120px)"
  onLoad={handleLoad}
  onError={handleError}
/>
```

### Theme Communication
The modeler uses `postMessage` API for cross-frame communication:

1. **Parent to Child**: Main UI sends theme changes to iframe
2. **Automatic Sync**: Initial theme is applied when modeler loads
3. **Persistence**: Theme preference is stored in localStorage

### Manual Theme Toggle
The modeler includes a theme toggle button (🌓) for standalone use, allowing users to switch themes independently when opened in a new tab.

## Technical Architecture

### File Structure
```
dadms-ui/
├── public/comprehensive_bpmn_modeler.html    # Standalone modeler with theme support
├── src/components/BPMNWorkspace/
│   └── BPMNModeler.tsx                       # React wrapper component
└── src/app/bpmn/page.tsx                     # BPMN workspace page
```

### Theme Integration Flow
1. User changes theme in main DADMS UI
2. `ThemeContext` updates throughout application
3. `BPMNModeler` component receives theme change
4. Component sends `postMessage` to iframe
5. BPMN modeler applies new theme instantly

## Usage

### In DADMS UI
Navigate to **BPMN Workspace** from the activity bar. The modeler will automatically use the current theme and switch when you change themes.

### Standalone
Open `/comprehensive_bpmn_modeler.html` directly. Use the theme toggle button to switch between light and dark modes.

## Benefits

- **Consistent UX**: No jarring theme mismatches when switching between DADMS components
- **Professional Appearance**: Clean, modern design in both light and dark themes
- **Accessibility**: Proper contrast ratios in all theme modes
- **Performance**: Smooth transitions with optimized CSS animations
- **Flexibility**: Works both embedded and standalone

## Technical Notes

### CSS Selectors
The modeler uses `!important` declarations for BPMN.js styling overrides to ensure theme colors are properly applied to the canvas elements.

### Browser Compatibility
- Modern browsers with CSS custom properties support
- `postMessage` API for cross-frame communication
- CSS Grid and Flexbox for responsive layout

### Testing
Test theme switching in:
- Embedded mode (within DADMS UI)
- Standalone mode (direct HTML access)
- Both light and dark system preferences 