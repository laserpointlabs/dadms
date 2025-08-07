# UI Development Standards & Best Practices

## 🎯 Core UI Development Principles

This document establishes comprehensive standards for building modern, maintainable user interfaces that prioritize user experience, accessibility, and code quality.

## 🏗️ Architecture Patterns

### **Component Architecture**

#### **Component Structure Standards**
```tsx
// ✅ GOOD: Well-structured component with proper TypeScript
interface ComponentProps {
  title: string;
  description?: string;
  onAction?: (data: ActionData) => void;
  className?: string;
  disabled?: boolean;
}

export const Component: React.FC<ComponentProps> = ({
  title,
  description,
  onAction,
  className = '',
  disabled = false
}) => {
  const handleAction = useCallback((data: ActionData) => {
    onAction?.(data);
  }, [onAction]);

  return (
    <div className={`component ${className}`}>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      <button 
        onClick={() => handleAction(data)}
        disabled={disabled}
        type="button"
      >
        Action
      </button>
    </div>
  );
};

// ❌ BAD: Poor component structure
function Component(props: any) {
  return (
    <div onClick={() => props.onClick && props.onClick()}>
      {props.title}
    </div>
  );
}
```

#### **Component Organization**
```
src/components/
├── shared/              # Reusable UI components
│   ├── Button.tsx
│   ├── Icon.tsx
│   ├── Card.tsx
│   ├── FormField.tsx
│   └── index.ts
├── feature-name/        # Feature-specific components
│   ├── FeatureHeader.tsx
│   ├── FeatureList.tsx
│   ├── FeatureForm.tsx
│   └── index.ts
└── layouts/            # Layout components
    ├── PageLayout.tsx
    ├── SidebarLayout.tsx
    └── index.ts
```

### **State Management Patterns**

#### **Local State Management**
```tsx
// ✅ GOOD: Proper state management with TypeScript
interface FormState {
  name: string;
  email: string;
  isValid: boolean;
}

const [formData, setFormData] = useState<FormState>({
  name: '',
  email: '',
  isValid: false
});

const updateField = useCallback((field: keyof FormState, value: string) => {
  setFormData(prev => ({
    ...prev,
    [field]: value,
    isValid: validateForm({ ...prev, [field]: value })
  }));
}, []);

// ❌ BAD: Direct state mutation
const [formData, setFormData] = useState({});

const updateField = (field: string, value: any) => {
  formData[field] = value; // Direct mutation
  setFormData(formData);
};
```

#### **Context Pattern for Global State**
```tsx
// ✅ GOOD: Context with proper typing and error handling
interface AppContextType {
  theme: 'light' | 'dark';
  user: User | null;
  setTheme: (theme: 'light' | 'dark') => void;
  setUser: (user: User | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [user, setUser] = useState<User | null>(null);

  const contextValue = useMemo(() => ({
    theme,
    user,
    setTheme,
    setUser
  }), [theme, user]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
```

## 🎨 Design System Standards

### **Theme System Architecture**

#### **CSS Variables for Theme Switching**
```css
/* ✅ GOOD: CSS variables for theme switching */
:root {
  /* Light theme */
  --theme-bg-primary: #ffffff;
  --theme-bg-secondary: #f3f4f6;
  --theme-text-primary: #1f2937;
  --theme-text-secondary: #6b7280;
  --theme-accent-primary: #3b82f6;
  --theme-border: #d1d5db;
}

[data-theme="dark"] {
  /* Dark theme */
  --theme-bg-primary: #1f2937;
  --theme-bg-secondary: #374151;
  --theme-text-primary: #f9fafb;
  --theme-text-secondary: #d1d5db;
  --theme-accent-primary: #60a5fa;
  --theme-border: #4b5563;
}
```

#### **Theme Object Structure**
```typescript
// ✅ GOOD: Comprehensive theme object
export const theme = {
  colors: {
    background: {
      primary: 'var(--theme-bg-primary)',
      secondary: 'var(--theme-bg-secondary)',
      elevated: 'var(--theme-bg-elevated)',
    },
    text: {
      primary: 'var(--theme-text-primary)',
      secondary: 'var(--theme-text-secondary)',
      inverse: 'var(--theme-text-inverse)',
    },
    accent: {
      primary: 'var(--theme-accent-primary)',
      success: 'var(--theme-accent-success)',
      warning: 'var(--theme-accent-warning)',
      error: 'var(--theme-accent-error)',
    },
    border: {
      default: 'var(--theme-border)',
      focus: 'var(--theme-border-focus)',
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  typography: {
    fontFamily: {
      default: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"SF Mono", Monaco, "Cascadia Code", monospace',
    },
    fontSize: {
      xs: '11px',
      sm: '13px',
      md: '14px',
      lg: '16px',
      xl: '20px',
    }
  },
  borderRadius: {
    sm: '2px',
    md: '4px',
    lg: '6px',
    xl: '8px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 2px 8px 0 rgba(0, 0, 0, 0.4)',
    lg: '0 4px 16px 0 rgba(0, 0, 0, 0.5)',
  },
  zIndex: {
    dropdown: 1000,
    modal: 1200,
    popover: 1300,
    tooltip: 1400,
  }
};
```

### **Component Design Patterns**

#### **Button Component Standards**
```tsx
// ✅ GOOD: Comprehensive button component
interface ButtonProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: IconName;
  rightIcon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
}) => {
  const baseClasses = `
    inline-flex items-center justify-center gap-2 font-medium
    transition-all duration-200 focus:outline-none focus:ring-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `;

  const variantClasses = {
    primary: `
      bg-theme-accent-primary hover:opacity-90 text-theme-text-inverse
      focus:ring-theme-accent-primary
    `,
    secondary: `
      bg-theme-surface hover:bg-theme-surface-hover text-theme-text-primary
      border border-theme-border-light
    `,
    // ... other variants
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {loading ? (
        <Icon name="loading" size="sm" className="animate-spin" />
      ) : leftIcon ? (
        <Icon name={leftIcon} size="sm" />
      ) : null}
      {children}
      {rightIcon && !loading && (
        <Icon name={rightIcon} size="sm" />
      )}
    </button>
  );
};
```

#### **Icon System Standards**
```tsx
// ✅ GOOD: Consistent icon system
interface IconProps {
  name: IconName;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: string;
  title?: string;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  className = '',
  color,
  title
}) => {
  const iconSize = sizeMap[size];
  const iconClass = `icon icon-${name}`;

  return (
    <i
      className={`${iconClass} ${className}`}
      style={{
        fontSize: `${iconSize}px`,
        width: `${iconSize}px`,
        height: `${iconSize}px`,
        lineHeight: `${iconSize}px`,
        color: color,
        display: 'inline-block',
        textAlign: 'center',
      }}
      title={title}
      aria-hidden={!title}
      aria-label={title}
    />
  );
};

// Predefined icon mappings
export const Icons = {
  // Navigation
  home: 'home',
  search: 'search',
  settings: 'settings-gear',
  
  // Actions
  add: 'add',
  edit: 'edit',
  delete: 'trash',
  save: 'save',
  
  // Status
  success: 'check-circle',
  warning: 'warning',
  error: 'error',
  loading: 'loading',
} as const;
```

## 🎯 User Experience Standards

### **Accessibility Requirements**

#### **Semantic HTML and ARIA**
```tsx
// ✅ GOOD: Accessible component
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="fixed inset-0 bg-black bg-opacity-50" />
      <div
        ref={modalRef}
        className="relative bg-white rounded-lg p-6 max-w-md mx-auto mt-20"
        tabIndex={-1}
        role="document"
      >
        <h2 id="modal-title" className="text-lg font-semibold mb-4">
          {title}
        </h2>
        {children}
        <button
          onClick={onClose}
          className="absolute top-4 right-4"
          aria-label="Close modal"
        >
          <Icon name="close" />
        </button>
      </div>
    </div>
  );
};

// ❌ BAD: Inaccessible component
function Modal({ isOpen, children }) {
  if (!isOpen) return null;
  return (
    <div>
      {children}
      <button onClick={onClose}>X</button>
    </div>
  );
}
```

#### **Keyboard Navigation**
```tsx
// ✅ GOOD: Keyboard navigation support
export const TabBar: React.FC<TabBarProps> = ({ tabs, activeTab, onTabChange }) => {
  const handleKeyDown = (e: React.KeyboardEvent, tabId: string) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        onTabChange(tabId);
        break;
      case 'ArrowRight':
        e.preventDefault();
        const nextTab = getNextTab(tabId);
        if (nextTab) onTabChange(nextTab);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        const prevTab = getPrevTab(tabId);
        if (prevTab) onTabChange(prevTab);
        break;
    }
  };

  return (
    <div role="tablist" aria-label="Navigation tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={tab.id === activeTab}
          aria-controls={`panel-${tab.id}`}
          tabIndex={tab.id === activeTab ? 0 : -1}
          onClick={() => onTabChange(tab.id)}
          onKeyDown={(e) => handleKeyDown(e, tab.id)}
          className={`
            px-4 py-2 border-b-2 transition-colors
            ${tab.id === activeTab 
              ? 'border-theme-accent-primary text-theme-accent-primary' 
              : 'border-transparent text-theme-text-secondary hover:text-theme-text-primary'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
```

### **Responsive Design Patterns**

#### **Mobile-First Approach**
```tsx
// ✅ GOOD: Mobile-first responsive design
export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`
      bg-theme-bg-elevated rounded-lg shadow-sm border border-theme-border
      p-4 sm:p-6 lg:p-8
      ${className}
    `}>
      {children}
    </div>
  );
};

// ✅ GOOD: Responsive grid layout
export const Grid: React.FC<GridProps> = ({ children, columns = 1 }) => {
  return (
    <div className={`
      grid gap-4 sm:gap-6 lg:gap-8
      grid-cols-1 
      ${columns >= 2 ? 'sm:grid-cols-2' : ''}
      ${columns >= 3 ? 'lg:grid-cols-3' : ''}
      ${columns >= 4 ? 'xl:grid-cols-4' : ''}
    `}>
      {children}
    </div>
  );
};
```

#### **Breakpoint System**
```typescript
// ✅ GOOD: Consistent breakpoint system
export const breakpoints = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  xxl: '1536px',
} as const;

// Usage in CSS
const responsiveClasses = `
  text-sm sm:text-base lg:text-lg
  p-4 sm:p-6 lg:p-8
  grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
`;
```

## 🔧 Performance Standards

### **Component Optimization**

#### **Memoization Patterns**
```tsx
// ✅ GOOD: Proper memoization
export const ExpensiveComponent: React.FC<Props> = React.memo(({ data, onAction }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      processed: heavyComputation(item)
    }));
  }, [data]);

  const handleAction = useCallback((id: string) => {
    onAction(id);
  }, [onAction]);

  return (
    <div>
      {processedData.map(item => (
        <Item key={item.id} item={item} onAction={handleAction} />
      ))}
    </div>
  );
});

// ❌ BAD: Unnecessary re-renders
function ExpensiveComponent({ data, onAction }) {
  const processedData = data.map(item => ({
    ...item,
    processed: heavyComputation(item) // Runs on every render
  }));

  return (
    <div>
      {processedData.map(item => (
        <Item 
          key={item.id} 
          item={item} 
          onAction={(id) => onAction(id)} // New function every render
        />
      ))}
    </div>
  );
}
```

#### **Lazy Loading**
```tsx
// ✅ GOOD: Lazy loading for performance
const LazyComponent = React.lazy(() => import('./LazyComponent'));

export const App: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LazyComponent />
    </Suspense>
  );
};

// ✅ GOOD: Dynamic imports for code splitting
const loadFeature = () => import('./Feature');

export const FeatureLoader: React.FC = () => {
  const [Feature, setFeature] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    loadFeature().then(module => {
      setFeature(() => module.default);
    });
  }, []);

  if (!Feature) return <LoadingSpinner />;
  return <Feature />;
};
```

### **Bundle Optimization**

#### **Tree Shaking Support**
```typescript
// ✅ GOOD: Tree-shakeable exports
export { Button } from './Button';
export { Icon } from './Icon';
export { Card } from './Card';

// ❌ BAD: Default exports prevent tree shaking
export default { Button, Icon, Card };
```

#### **Image Optimization**
```tsx
// ✅ GOOD: Optimized image handling
export const OptimizedImage: React.FC<ImageProps> = ({
  src,
  alt,
  width,
  height,
  className = ''
}) => {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      className={`object-cover ${className}`}
      onError={(e) => {
        e.currentTarget.src = '/fallback-image.png';
      }}
    />
  );
};
```

## 🧪 Testing Standards

### **Component Testing**

#### **Unit Test Patterns**
```tsx
// ✅ GOOD: Comprehensive component tests
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading state', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });
});
```

#### **Integration Test Patterns**
```tsx
// ✅ GOOD: Integration tests for user workflows
describe('User Registration Flow', () => {
  it('completes registration successfully', async () => {
    render(<RegistrationForm />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    
    // Verify success state
    await waitFor(() => {
      expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
    });
  });

  it('shows validation errors for invalid input', async () => {
    render(<RegistrationForm />);
    
    // Submit empty form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    
    // Verify error messages
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });
});
```

### **Visual Regression Testing**

#### **Storybook Integration**
```tsx
// ✅ GOOD: Storybook stories for visual testing
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'tertiary', 'danger', 'success'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
};

export const Loading: Story = {
  args: {
    children: 'Loading Button',
    loading: true,
  },
};
```

## 📱 Mobile and Touch Standards

### **Touch Interaction Patterns**

#### **Touch-Friendly Components**
```tsx
// ✅ GOOD: Touch-friendly button sizes
export const TouchButton: React.FC<ButtonProps> = (props) => {
  return (
    <Button
      {...props}
      className={`
        min-h-[44px] min-w-[44px]  // Minimum touch target size
        ${props.className || ''}
      `}
    />
  );
};

// ✅ GOOD: Touch-friendly spacing
export const TouchList: React.FC<ListProps> = ({ items }) => {
  return (
    <div className="space-y-2"> {/* Adequate spacing for touch */}
      {items.map(item => (
        <TouchButton
          key={item.id}
          className="w-full p-4 text-left" // Full width for easy tapping
        >
          {item.label}
        </TouchButton>
      ))}
    </div>
  );
};
```

#### **Gesture Support**
```tsx
// ✅ GOOD: Swipe gesture support
export const SwipeableCard: React.FC<CardProps> = ({ children, onSwipe }) => {
  const [startX, setStartX] = useState<number | null>(null);
  const [currentX, setCurrentX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (startX && currentX) {
      const diff = startX - currentX;
      if (Math.abs(diff) > 50) { // Minimum swipe distance
        onSwipe(diff > 0 ? 'left' : 'right');
      }
    }
    setStartX(null);
    setCurrentX(null);
  };

  return (
    <div
      className="touch-pan-y" // Enable touch gestures
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
};
```

## 🔒 Security Standards

### **Input Validation and Sanitization**

#### **Form Security**
```tsx
// ✅ GOOD: Secure form handling
export const SecureForm: React.FC<FormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    const errors = validateForm(formData);
    if (errors.length > 0) {
      setErrors(errors);
      return;
    }

    // Sanitize data before submission
    const sanitizedData = {
      name: DOMPurify.sanitize(formData.name),
      email: formData.email.toLowerCase().trim(),
      message: DOMPurify.sanitize(formData.message)
    };

    onSubmit(sanitizedData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData(prev => ({
          ...prev,
          name: e.target.value
        }))}
        maxLength={100} // Prevent excessive input
        pattern="[A-Za-z0-9\s]+" // Allow only safe characters
      />
      {/* Other form fields */}
    </form>
  );
};
```

### **XSS Prevention**

#### **Safe Content Rendering**
```tsx
// ✅ GOOD: Safe content rendering
export const SafeContent: React.FC<ContentProps> = ({ content }) => {
  // Sanitize HTML content
  const sanitizedContent = useMemo(() => {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a'],
      ALLOWED_ATTR: ['href', 'target']
    });
  }, [content]);

  return (
    <div 
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      className="prose prose-sm max-w-none"
    />
  );
};

// ❌ BAD: Unsafe content rendering
function UnsafeContent({ content }) {
  return (
    <div dangerouslySetInnerHTML={{ __html: content }} />
  );
}
```

## 📊 Error Handling Standards

### **Error Boundary Pattern**

#### **Component Error Boundaries**
```tsx
// ✅ GOOD: Error boundary with fallback UI
export class ComponentErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component error:', error, errorInfo);
    // Log to error reporting service
    logError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-theme-accent-error rounded-lg">
          <h3 className="text-theme-accent-error font-semibold mb-2">
            Something went wrong
          </h3>
          <p className="text-theme-text-secondary text-sm mb-4">
            We're sorry, but something unexpected happened.
          </p>
          <Button
            variant="secondary"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### **Loading and Error States**

#### **Comprehensive State Management**
```tsx
// ✅ GOOD: Comprehensive loading and error states
export const DataComponent: React.FC<DataProps> = ({ data, error, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3">
          <Icon name="loading" className="animate-spin" />
          <span className="text-theme-text-secondary">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-theme-accent-error rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="error" className="text-theme-accent-error" />
          <h3 className="text-theme-accent-error font-semibold">
            Error loading data
          </h3>
        </div>
        <p className="text-theme-text-secondary text-sm">
          {error.message}
        </p>
        <Button
          variant="secondary"
          onClick={() => window.location.reload()}
          className="mt-3"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center p-8">
        <Icon name="info" className="mx-auto mb-2 text-theme-text-muted" />
        <p className="text-theme-text-secondary">No data available</p>
      </div>
    );
  }

  return (
    <div>
      {/* Render data */}
    </div>
  );
};
```

## 🎯 Code Quality Standards

### **TypeScript Best Practices**

#### **Strict Type Safety**
```typescript
// ✅ GOOD: Strict TypeScript usage
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: Date;
}

interface UserListProps {
  users: User[];
  onUserSelect: (user: User) => void;
  selectedUserId?: string;
  loading?: boolean;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  onUserSelect,
  selectedUserId,
  loading = false
}) => {
  const handleUserClick = useCallback((user: User) => {
    onUserSelect(user);
  }, [onUserSelect]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-2">
      {users.map(user => (
        <UserCard
          key={user.id}
          user={user}
          isSelected={user.id === selectedUserId}
          onClick={() => handleUserClick(user)}
        />
      ))}
    </div>
  );
};

// ❌ BAD: Loose typing
function UserList(props: any) {
  return (
    <div>
      {props.users.map((user: any) => (
        <div key={user.id} onClick={() => props.onClick(user)}>
          {user.name}
        </div>
      ))}
    </div>
  );
}
```

### **Code Organization**

#### **File Structure Standards**
```
src/
├── components/
│   ├── shared/           # Reusable components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   └── feature/          # Feature-specific components
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
├── types/               # TypeScript type definitions
├── constants/           # Application constants
└── styles/              # Global styles and themes
```

#### **Import/Export Standards**
```typescript
// ✅ GOOD: Clean imports and exports
// index.ts - Barrel exports
export { Button } from './Button';
export { Icon } from './Icon';
export { Card } from './Card';
export type { ButtonProps } from './Button';

// Component file
import { useState, useCallback, useMemo } from 'react';
import { Icon } from '../Icon';
import { Button } from '../Button';
import type { ComponentProps } from './types';

// ❌ BAD: Messy imports
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import * as Components from '../components';
```

## 🚀 Performance Optimization

### **Bundle Size Optimization**

#### **Code Splitting Patterns**
```tsx
// ✅ GOOD: Route-based code splitting
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));

export const App: React.FC = () => {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Suspense>
    </Router>
  );
};
```

#### **Tree Shaking Support**
```typescript
// ✅ GOOD: Tree-shakeable exports
// components/index.ts
export { Button } from './Button';
export { Icon } from './Icon';
export { Card } from './Card';

// ❌ BAD: Prevents tree shaking
export default {
  Button,
  Icon,
  Card
};
```

### **Image and Asset Optimization**

#### **Responsive Images**
```tsx
// ✅ GOOD: Responsive image handling
export const ResponsiveImage: React.FC<ImageProps> = ({
  src,
  alt,
  sizes = '100vw',
  className = ''
}) => {
  return (
    <img
      src={src}
      alt={alt}
      sizes={sizes}
      className={`w-full h-auto ${className}`}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.src = '/fallback-image.png';
      }}
    />
  );
};
```

## 📋 Development Workflow

### **Pre-commit Standards**

#### **Code Quality Checks**
```json
// package.json scripts
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

#### **ESLint Configuration**
```json
// .eslintrc.json
{
  "extends": [
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "prefer-const": "error",
    "no-console": "warn"
  }
}
```

### **Component Development Workflow**

#### **Development Checklist**
- [ ] **TypeScript types** defined for all props
- [ ] **Accessibility attributes** added (aria-*)
- [ ] **Keyboard navigation** supported
- [ ] **Error boundaries** implemented
- [ ] **Loading states** handled
- [ ] **Responsive design** tested
- [ ] **Unit tests** written
- [ ] **Storybook stories** created
- [ ] **Documentation** updated

#### **Code Review Standards**
- **Type safety** maintained
- **Accessibility** requirements met
- **Performance** considerations addressed
- **Security** implications reviewed
- **Testing** coverage adequate
- **Documentation** updated

---

**These standards ensure consistent, maintainable, and high-quality UI development across all projects.** 