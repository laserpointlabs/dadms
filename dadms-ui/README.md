# DADMS 2.0 UI - VSCode-Style Interface

A React application that mimics the Visual Studio Code (VSCode) UI, built for the Decision Analysis and Decision Management System (DADMS) 2.0.

## Features

### 🎨 Authentic VSCode Appearance
- **Activity Bar**: Left sidebar with main navigation icons (Explorer, Search, Source Control, Debug, Extensions)
- **Explorer Sidebar**: File-tree style navigation for DADMS modules
- **Tab Bar**: VSCode-style tabs showing current page/file
- **Monaco Editor**: Full-featured code editor with syntax highlighting
- **Status Bar**: Bottom status bar with project information and indicators
- **VSCode Dark Theme**: Authentic color scheme and styling
- **Codicon Icons**: Official VSCode icon font for authentic appearance

### 🏗️ DADMS Integration
- **Project Management**: Create and manage decision projects
- **Knowledge Base**: Document upload and RAG search
- **LLM Playground**: AI model testing and experimentation  
- **Context Manager**: Manage prompts, personas, and tools
- **BPMN Workspace**: Design decision workflows
- **Process Manager**: Monitor workflow execution
- **Thread Manager**: Trace decision threads
- **Decision Assistant**: Finalize decisions with AI assistance

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Dependencies
```json
{
  "@monaco-editor/react": "^4.6.0",
  "@vscode/codicons": "^0.0.36", 
  "monaco-editor": "^0.52.0",
  "next": "15.4.1",
  "react": "19.1.0",
  "react-dom": "19.1.0"
}
```

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000)

## File Structure

```
src/
├── app/
│   ├── layout.tsx          # Main VSCode-style layout
│   ├── page.tsx            # Home page with Monaco Editor
│   ├── globals.css         # VSCode theme and styling
│   └── [pages]/            # Individual DADMS pages
├── components/
│   ├── VSCodeEditor.tsx    # Monaco Editor component
│   └── AASCar.tsx         # Agent Assistant floating panel
```

## Components

### Layout (layout.tsx)
- **ActivityBar**: Main navigation with VSCode-style icons
- **SidebarView**: Contextual sidebar content (Explorer, Search, etc.)
- **TabBar**: Shows current page as an active tab
- **StatusBar**: Project status and information
- **Client-side routing**: Uses Next.js App Router

### VSCodeEditor (VSCodeEditor.tsx)
- Monaco Editor integration with VSCode dark theme
- TypeScript syntax highlighting
- Line numbers, minimap, bracket matching
- Smooth scrolling and cursor animation
- Configurable language and read-only modes

### CSS (globals.css)
- Authentic VSCode color variables
- Activity bar, sidebar, tab, and status bar styling
- Monaco editor integration styles
- Custom scrollbars matching VSCode
- Codicon font integration

## VSCode Features Implemented

✅ **Layout Structure**
- Title bar with application title
- Activity bar (48px width)
- Resizable sidebar (300px default)
- Tab bar for open files/pages
- Main editor area
- Status bar

✅ **Styling**
- VSCode dark theme colors
- Codicon icon font
- Hover effects and active states
- Authentic borders and spacing

✅ **Editor Integration**
- Monaco Editor with VSCode theme
- Syntax highlighting
- Line numbers and minimap
- Bracket pair colorization

## Development

### Scripts
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Port Configuration
The application runs on port 3000 by default. If port 3000 is occupied, Next.js will automatically find the next available port.

DADMS services are allocated ports as follows:
- UI: 3000 (or next available)
- Project Service: 3001
- LLM Service: 3002  
- Knowledge Service: 3003
- Event Bus Service: 3004
- Agent Assistance Service: 3005

## Technology Stack

- **Framework**: Next.js 15.4.1 with App Router
- **Language**: TypeScript 5
- **Styling**: CSS with CSS Variables + Tailwind CSS 4
- **Editor**: Monaco Editor (VSCode's editor)
- **Icons**: VSCode Codicons
- **UI Components**: Material-UI + Custom VSCode-style components

## Future Enhancements

🔄 **Planned Features**
- Command Palette (Cmd/Ctrl+Shift+P)
- Settings/Preferences panel
- Extension marketplace simulation
- Multiple editor tabs
- Terminal integration
- File search and replace
- Git integration display
- Debugging panel

## Notes

- The interface prioritizes authentic VSCode appearance while maintaining DADMS functionality
- Monaco Editor provides professional code editing capabilities
- All DADMS pages are accessible through the Explorer sidebar
- The application is designed for engineering teams requiring serious, professional tooling

---

**DADMS 2.0** - Professional decision intelligence platform with authentic VSCode interface.
