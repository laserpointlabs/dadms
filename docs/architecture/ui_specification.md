# DADMS 2.0 - User Interface Specification

## Executive Summary

The DADMS 2.0 User Interface is a modern, professional React-based application built with Next.js that provides a comprehensive interface for decision intelligence workflows. Designed with a VS Code-inspired layout and professional dark theme, the UI delivers an intuitive, powerful experience for decision analysis, knowledge management, process execution, and collaborative decision-making.

**Current Status**: ✅ **ACTIVE DEVELOPMENT** - Design System Implementation Phase  
**Technology**: Next.js 15.4.1, React 19.1.0, TypeScript 5+, VS Code Codicons  
**Port**: 3000 (primary), 3002 (fallback)

## Recent Enhancements (2025-01-15 - v2)

### ✅ Professional Design System
- **Unified Theme**: Consistent VS Code-inspired dark theme across all pages
- **Icon System**: Replaced emoji icons with professional VS Code Codicons
- **Component Library**: Reusable components for consistent UI patterns
- **Loading States**: Skeleton loaders and proper loading indicators
- **Type Safety**: Comprehensive TypeScript interfaces for all data

### ✅ Shared Component Library
```typescript
// Core components now available
import { 
  Button, Card, Icon, LoadingState, 
  PageLayout, Skeleton, Alert, Modal 
} from '@/components/shared';
```

## Design System

### Theme Configuration
```typescript
// src/design-system/theme.ts
export const dadmsTheme = {
  colors: {
    background: {
      primary: '#1e1e1e',      // Editor background
      secondary: '#252526',    // Sidebar background
      tertiary: '#333333',     // Activity bar
    },
    text: {
      primary: '#d4d4d4',
      secondary: '#cccccc',
      muted: '#6e7681',
    },
    accent: {
      primary: '#007acc',      // VS Code blue
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
    }
  }
};
```

### Component Architecture

#### Shared Components
1. **Button**: Consistent button styles with icon support
2. **Card**: Content containers with variants
3. **Icon**: VS Code Codicons integration
4. **LoadingState**: Loading spinners and skeletons
5. **PageLayout**: Standardized page structure
6. **Modal**: Consistent dialog implementation
7. **Alert**: Status messages and notifications

#### Page Structure Template
```typescript
<PageLayout
  title="Page Title"
  subtitle="Description"
  icon="icon-name"
  actions={<Button>Action</Button>}
  status={{ text: "Active", type: "active" }}
>
  <PageContent>
    {/* Page specific content */}
  </PageContent>
</PageLayout>
```

## Earlier Enhancements (2025-01-15 - v1)

### ✅ DADMS-Specific Activity Bar
- **Replaced VS Code Icons**: Custom navigation for DADMS tools
- **Direct Tool Access**: Projects, Knowledge, Ontology, LLM, Context, BPMN, Process, Thread, AADS
- **Visual Feedback**: Active state highlighting

### ✅ Project Tree View
- **Hierarchical Explorer**: Projects and associated objects
- **Object Types**: Ontologies, Knowledge, Models, Simulations, Processes, Threads
- **Interactive Controls**: Expand/collapse, refresh, actions
- **Status Indicators**: Visual badges for object states

## Core Features

### 1. VS Code-Inspired Layout
- **Activity Bar** (left): Primary navigation with DADMS tools
- **Sidebar**: Context-sensitive panels (Explorer, Search, etc.)
- **Editor Area**: Main content area for active tools
- **Status Bar**: System status and notifications
- **Professional Dark Theme**: Consistent with VS Code aesthetics

### 2. Service Integration Pages

#### Projects Dashboard
- **Path**: `/projects`
- **Features**: 
  - Project CRUD operations
  - Status tracking (Active, Completed, On Hold)
  - Decision context management
  - Team collaboration
- **Components**: ProjectList, ProjectCard, CreateProject

#### Knowledge Management
- **Path**: `/knowledge`
- **Features**:
  - Document upload and processing
  - Domain-based organization
  - Tag management
  - Semantic search
- **Components**: DocumentUpload, DomainManagement, KnowledgeSearch

#### LLM Playground
- **Path**: `/llm`
- **Features**:
  - Multi-provider support (OpenAI, Anthropic, Ollama)
  - Model selection and configuration
  - Thread context integration
  - Response streaming
- **Components**: ProviderSelector, ModelConfig, ChatInterface

#### Context Manager
- **Path**: `/context`
- **Features**:
  - AI Persona management
  - Team composition
  - Tool integration
  - Prompt templates
- **Components**: PersonaManager, TeamBuilder, PromptManager

#### BPMN Workspace
- **Path**: `/bpmn`
- **Features**:
  - Visual workflow design
  - BPMN 2.0 compliance
  - Real-time collaboration
  - Process validation
- **Components**: BPMNModeler (iframe integration)

#### Process Manager
- **Path**: `/process`
- **Features**:
  - Process execution monitoring
  - Task management
  - Incident handling
  - Performance analytics
- **Components**: ProcessList, TaskQueue, IncidentPanel

#### Thread Manager
- **Path**: `/thread`
- **Features**:
  - Execution thread tracking
  - Feedback collection
  - Impact analysis
  - Process improvement
- **Components**: ThreadList, FeedbackForm, ImpactVisualizer

#### AADS (Agent Assistant)
- **Path**: `/aads`
- **Features**:
  - Decision finalization
  - Documentation generation
  - Stakeholder collaboration
  - Approval workflows
- **Components**: DecisionWizard, DocumentGenerator, ApprovalFlow

### 3. Common UI Patterns

#### Navigation
- **Activity Bar**: Icon-based primary navigation
- **Breadcrumbs**: Hierarchical location indicator
- **Tab System**: Multiple open items management
- **Quick Access**: Command palette (Ctrl+P)

#### Data Display
- **Cards**: Project and content cards
- **Tables**: Sortable, filterable data grids
- **Trees**: Hierarchical data visualization
- **Charts**: Analytics and metrics

#### User Feedback
- **Loading States**: Skeletons and spinners
- **Error Messages**: Contextual error display
- **Success Notifications**: Toast messages
- **Progress Indicators**: Multi-step processes

#### Forms
- **Validation**: Real-time field validation
- **Auto-save**: Draft preservation
- **Multi-step**: Wizard interfaces
- **File Upload**: Drag-and-drop support

## Technical Implementation

### State Management
```typescript
// React hooks for local state
const [projects, setProjects] = useState<Project[]>([]);

// Context for global state
const AppContext = createContext<AppState>();

// Future: Redux/Zustand for complex state
```

### API Integration
```typescript
// Service layer abstraction
export const projectApi = {
  fetchProjects: async (): Promise<ProjectsResponse> => {
    const response = await fetch('/api/projects');
    return response.json();
  },
  createProject: async (data: CreateProjectRequest) => {
    // Implementation
  }
};
```

### Type Safety
```typescript
// Comprehensive type definitions
interface Project extends BaseEntity {
  name: string;
  status: ProjectStatus;
  decisionContext: string;
  // ... full definition in types/services/project.ts
}
```

### Component Patterns
```typescript
// Consistent component structure
export const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // Hooks
  const [state, setState] = useState();
  
  // Effects
  useEffect(() => {}, []);
  
  // Handlers
  const handleAction = () => {};
  
  // Render
  return <PageLayout>{/* content */}</PageLayout>;
};
```

## Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Adaptive Layouts
- **Collapsible Sidebar**: Hidden on mobile
- **Responsive Grid**: Column adjustment
- **Touch Optimized**: Larger tap targets on mobile
- **Orientation Support**: Landscape/portrait modes

## Form Validation

### Validation System
- **Validation Rules**: Reusable validators for common patterns
  - Required fields with custom messages
  - Length constraints (min/max)
  - Pattern matching (email, URL, alphanumeric)
  - Custom business logic validators
- **Form Schemas**: Pre-defined validation schemas for entities
- **Real-time Feedback**: Touch-based validation with immediate feedback

### Form Components
- **FormField**: Wrapper component with label, error, and help text
- **Input/TextArea/Select**: Form controls with consistent error states
- **Error Display**: Icon + message below fields
- **Help Text**: Contextual guidance for users

### User Experience
- **Progressive Disclosure**: Errors shown after interaction
- **Clear Messaging**: Specific, actionable error messages
- **Visual Feedback**: Red borders and error icons
- **Accessibility**: ARIA attributes for screen readers

## Accessibility

### WCAG 2.1 AA Compliance
- **Color Contrast**: Minimum 4.5:1 ratio
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: ARIA labels and roles
- **Focus Management**: Visible focus indicators

### Interaction Patterns
- **Tab Order**: Logical navigation flow
- **Skip Links**: Jump to main content
- **Announcements**: Live regions for updates
- **Form Labels**: Associated with inputs
- **Error Announcements**: Form validation errors announced
- **Required Indicators**: Clear visual and semantic markers

## Error Handling

### Error Display Components
- **Alert**: Inline error/warning/info/success messages
  - Contextual icons and colors
  - Optional dismiss button
  - Support for titles and actions
- **Toast**: Temporary notifications
  - Auto-dismiss with configurable duration
  - Position control (corners)
  - Slide-in animation
- **AlertDialog**: Confirmation dialogs
  - Modal overlay
  - Customizable actions
  - Variant-based styling

### Error Boundaries
- **Component-level**: Catch and display runtime errors
- **Page-level**: Prevent full app crashes
- **Custom Fallbacks**: Tailored error messages
- **Development Mode**: Detailed stack traces

### User Experience
- **Graceful Degradation**: Maintain functionality where possible
- **Clear Messaging**: Actionable error descriptions
- **Recovery Options**: Try again, go home, contact support
- **Error Logging**: Automatic reporting in production

## Performance

### Optimization Strategies
- **Code Splitting**: Route-based chunking
- **Lazy Loading**: Components and images
- **Memoization**: Expensive computations
- **Virtual Scrolling**: Large lists

### Metrics Targets
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1
- **Lighthouse Score**: > 90

## Browser Support

### Supported Browsers
- **Chrome**: Latest 2 versions
- **Firefox**: Latest 2 versions
- **Safari**: Latest 2 versions
- **Edge**: Latest 2 versions

### Progressive Enhancement
- **Core Functionality**: Works without JS
- **Enhanced Features**: With modern browser APIs
- **Polyfills**: For critical features
- **Graceful Degradation**: Older browsers

## Future Enhancements

### Phase 1 (Current)
- ✅ Design system implementation
- ✅ Component library creation
- ✅ Projects page refactoring
- 🔄 Remaining pages migration

### Phase 2 (Next)
- Advanced data visualization
- Real-time collaboration features
- Offline support with PWA
- Enhanced mobile experience

### Phase 3 (Future)
- AI-powered UI assistance
- Customizable dashboards
- Plugin system
- Multi-language support

## Development Guidelines

### Code Style
```typescript
// Use functional components
// Implement proper TypeScript types
// Follow React best practices
// Use shared components
// Maintain consistent styling
```

### Testing Requirements
- Unit tests for utilities
- Component tests with React Testing Library
- Integration tests for pages
- E2E tests for critical flows

### Documentation
- Component storybook
- API documentation
- Usage examples
- Migration guides

This specification ensures DADMS 2.0 delivers a professional, consistent, and powerful user interface that enhances decision intelligence workflows while maintaining excellent developer experience and user satisfaction. 