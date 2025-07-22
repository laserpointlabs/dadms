# DADMS 2.0 - UI Component Development Guidelines

## Component Architecture Guidelines

### Component Structure Pattern

```typescript
// 1. Interface Definition
interface ComponentNameProps {
    // Required props
    data: DataType;
    onAction: (id: string) => void;
    
    // Optional props with defaults
    variant?: 'default' | 'compact' | 'detailed';
    disabled?: boolean;
    className?: string;
    
    // Event handlers
    onSelect?: (item: DataType) => void;
    onError?: (error: Error) => void;
}

// 2. Component Implementation
const ComponentName: React.FC<ComponentNameProps> = ({
    data,
    onAction,
    variant = 'default',
    disabled = false,
    className,
    onSelect,
    onError
}) => {
    // 3. Local state and hooks
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // 4. Derived state and memoization
    const processedData = useMemo(() => {
        return data.map(item => ({
            ...item,
            displayName: formatDisplayName(item.name)
        }));
    }, [data]);
    
    // 5. Event handlers
    const handleItemClick = useCallback((item: DataType) => {
        if (disabled) return;
        onSelect?.(item);
    }, [disabled, onSelect]);
    
    // 6. Effects
    useEffect(() => {
        if (error) {
            onError?.(new Error(error));
        }
    }, [error, onError]);
    
    // 7. Early returns for loading/error states
    if (loading) {
        return <ComponentLoadingSpinner />;
    }
    
    if (error) {
        return <ComponentErrorDisplay error={error} />;
    }
    
    // 8. Main render
    return (
        <div className={`component-name ${variant} ${className}`}>
            {/* Component content */}
        </div>
    );
};

// 9. Default props and display name
ComponentName.displayName = 'ComponentName';

// 10. Export with memo for performance
export default memo(ComponentName);
```

### Hook Patterns

#### Data Fetching Hook
```typescript
const useDataFetching = <T>(
    fetcher: () => Promise<T>,
    dependencies: React.DependencyList = []
) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await fetcher();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, dependencies);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    return { data, loading, error, refetch: fetchData };
};
```

#### Form Management Hook
```typescript
const useForm = <T extends Record<string, any>>(
    initialValues: T,
    validator?: (values: T) => Record<keyof T, string>
) => {
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
    const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
    
    const setValue = useCallback((name: keyof T, value: any) => {
        setValues(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    }, [errors]);
    
    const setFieldTouched = useCallback((name: keyof T) => {
        setTouched(prev => ({ ...prev, [name]: true }));
    }, []);
    
    const validate = useCallback(() => {
        if (!validator) return true;
        const validationErrors = validator(values);
        setErrors(validationErrors);
        return Object.keys(validationErrors).length === 0;
    }, [validator, values]);
    
    const reset = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
    }, [initialValues]);
    
    return {
        values,
        errors,
        touched,
        setValue,
        setFieldTouched,
        validate,
        reset,
        isValid: Object.keys(errors).length === 0
    };
};
```

### Service Integration Patterns

#### API Service Hook
```typescript
const useAPIService = <TResponse, TRequest = void>(
    serviceCall: (request: TRequest) => Promise<TResponse>
) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<APIError | null>(null);
    
    const execute = useCallback(async (request: TRequest): Promise<TResponse | null> => {
        try {
            setLoading(true);
            setError(null);
            const result = await serviceCall(request);
            return result;
        } catch (err) {
            const apiError = err instanceof APIError ? err : new APIError('Unknown error', 0, 'UNKNOWN');
            setError(apiError);
            return null;
        } finally {
            setLoading(false);
        }
    }, [serviceCall]);
    
    return { execute, loading, error };
};

// Usage example
const ProjectList: React.FC = () => {
    const { execute: loadProjects, loading, error } = useAPIService(projectApi.getProjects);
    const [projects, setProjects] = useState<Project[]>([]);
    
    useEffect(() => {
        const fetchProjects = async () => {
            const result = await loadProjects();
            if (result) {
                setProjects(result);
            }
        };
        fetchProjects();
    }, [loadProjects]);
    
    return (
        <div>
            {loading && <LoadingSpinner />}
            {error && <ErrorDisplay error={error} />}
            {projects.map(project => (
                <ProjectCard key={project.id} project={project} />
            ))}
        </div>
    );
};
```

## Component Library Standards

### Material-UI Integration

#### Theme Configuration
```typescript
const dadmsTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#007acc',
            light: '#1177bb',
            dark: '#0e639c',
        },
        secondary: {
            main: '#37373d',
            light: '#2a2d2e',
            dark: '#252526',
        },
        background: {
            default: '#1e1e1e',
            paper: '#252526',
        },
        text: {
            primary: '#cccccc',
            secondary: '#969696',
        },
    },
    typography: {
        fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            'Helvetica',
            'Arial',
            'sans-serif',
        ].join(','),
        fontSize: 13,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 2,
                    fontSize: 13,
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundColor: 'var(--vscode-sidebar-background)',
                    border: '1px solid var(--vscode-panel-border)',
                },
            },
        },
    },
});
```

#### Custom Component Wrappers
```typescript
// VS Code styled button
const VSCodeButton: React.FC<ButtonProps & { vsCodeVariant?: 'primary' | 'secondary' | 'icon' }> = ({
    vsCodeVariant = 'primary',
    children,
    ...props
}) => {
    const className = `vscode-button vscode-button--${vsCodeVariant}`;
    
    return (
        <Button
            {...props}
            className={`${className} ${props.className || ''}`}
            disableRipple
        >
            {children}
        </Button>
    );
};

// VS Code styled input field
const VSCodeTextField: React.FC<TextFieldProps> = (props) => {
    return (
        <TextField
            {...props}
            variant="outlined"
            size="small"
            sx={{
                '& .MuiOutlinedInput-root': {
                    backgroundColor: 'var(--vscode-input-background)',
                    color: 'var(--vscode-input-foreground)',
                    fontSize: 13,
                    '& fieldset': {
                        borderColor: 'var(--vscode-input-border)',
                    },
                    '&:hover fieldset': {
                        borderColor: 'var(--vscode-input-border)',
                    },
                    '&.Mui-focused fieldset': {
                        borderColor: 'var(--vscode-button-background)',
                    },
                },
            }}
        />
    );
};
```

### Loading States

#### Loading Components
```typescript
// Skeleton loading for cards
const ProjectCardSkeleton: React.FC = () => (
    <Card className="project-card">
        <CardContent>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="100%" height={16} />
            <Skeleton variant="text" width="80%" height={16} />
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Skeleton variant="rectangular" width={60} height={20} />
                <Skeleton variant="rectangular" width={80} height={20} />
            </Box>
        </CardContent>
    </Card>
);

// Loading spinner for full page
const PageLoadingSpinner: React.FC = () => (
    <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        minHeight: 200 
    }}>
        <CircularProgress size={40} />
    </Box>
);

// Loading state for lists
const ListLoadingState: React.FC<{ count?: number }> = ({ count = 3 }) => (
    <>
        {Array.from({ length: count }, (_, index) => (
            <ProjectCardSkeleton key={index} />
        ))}
    </>
);
```

### Error Handling

#### Error Display Components
```typescript
interface ErrorDisplayProps {
    error: Error | APIError | string;
    onRetry?: () => void;
    className?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry, className }) => {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorCode = error instanceof APIError ? error.code : undefined;
    
    return (
        <Alert 
            severity="error" 
            className={className}
            action={
                onRetry && (
                    <Button color="inherit" size="small" onClick={onRetry}>
                        Retry
                    </Button>
                )
            }
        >
            <AlertTitle>Error {errorCode && `(${errorCode})`}</AlertTitle>
            {errorMessage}
        </Alert>
    );
};

// Error boundary for components
const ComponentErrorBoundary: React.FC<{ 
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error }>;
}> = ({ children, fallback: Fallback = ErrorDisplay }) => {
    return (
        <ErrorBoundary
            fallback={({ error }) => <Fallback error={error} />}
        >
            {children}
        </ErrorBoundary>
    );
};
```

## Performance Optimization

### Memoization Guidelines

```typescript
// 1. Memo for expensive components
const ExpensiveProjectList = memo<ProjectListProps>(({ projects, onSelect }) => {
    // Expensive rendering logic
    return (
        <div>
            {projects.map(project => (
                <ProjectCard key={project.id} project={project} onSelect={onSelect} />
            ))}
        </div>
    );
});

// 2. useMemo for expensive calculations
const ProjectStatistics: React.FC<{ projects: Project[] }> = ({ projects }) => {
    const statistics = useMemo(() => {
        return {
            total: projects.length,
            active: projects.filter(p => p.status === 'active').length,
            completed: projects.filter(p => p.status === 'completed').length,
            averageProgress: projects.reduce((sum, p) => sum + p.progress, 0) / projects.length
        };
    }, [projects]);
    
    return <StatisticsDisplay stats={statistics} />;
};

// 3. useCallback for event handlers
const ProjectGrid: React.FC<{ projects: Project[] }> = ({ projects }) => {
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    
    const handleProjectSelect = useCallback((projectId: string) => {
        setSelectedProject(projectId);
        // Additional logic
    }, []);
    
    return (
        <Grid container spacing={2}>
            {projects.map(project => (
                <Grid item xs={12} sm={6} md={4} key={project.id}>
                    <ProjectCard 
                        project={project} 
                        onSelect={handleProjectSelect}
                        selected={selectedProject === project.id}
                    />
                </Grid>
            ))}
        </Grid>
    );
};
```

### Virtual Scrolling Implementation

```typescript
const VirtualizedProjectList: React.FC<{
    projects: Project[];
    onProjectSelect: (project: Project) => void;
}> = ({ projects, onProjectSelect }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerHeight, setContainerHeight] = useState(400);
    
    useEffect(() => {
        const updateHeight = () => {
            if (containerRef.current) {
                setContainerHeight(containerRef.current.clientHeight);
            }
        };
        
        window.addEventListener('resize', updateHeight);
        updateHeight();
        
        return () => window.removeEventListener('resize', updateHeight);
    }, []);
    
    return (
        <div ref={containerRef} style={{ height: '100%' }}>
            <VirtualizedList
                items={projects}
                itemHeight={120}
                containerHeight={containerHeight}
                renderItem={(project, index) => (
                    <ProjectCard
                        key={project.id}
                        project={project}
                        onSelect={() => onProjectSelect(project)}
                        variant="compact"
                    />
                )}
            />
        </div>
    );
};
```

## Accessibility Implementation

### ARIA Patterns

```typescript
// Accessible dropdown menu
const AccessibleDropdown: React.FC<{
    trigger: React.ReactNode;
    children: React.ReactNode;
    id: string;
}> = ({ trigger, children, id }) => {
    const [open, setOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const menuRef = useRef<HTMLDivElement>(null);
    
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'Escape':
                setOpen(false);
                break;
            case 'ArrowDown':
                e.preventDefault();
                setFocusedIndex(prev => Math.min(prev + 1, React.Children.count(children) - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocusedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                // Handle selection
                break;
        }
    }, [children]);
    
    return (
        <div className="accessible-dropdown">
            <div
                role="button"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={`${id}-menu`}
                onClick={() => setOpen(!open)}
                onKeyDown={handleKeyDown}
                tabIndex={0}
            >
                {trigger}
            </div>
            {open && (
                <div
                    ref={menuRef}
                    id={`${id}-menu`}
                    role="menu"
                    aria-labelledby={`${id}-trigger`}
                >
                    {children}
                </div>
            )}
        </div>
    );
};

// Accessible form field
const AccessibleFormField: React.FC<{
    label: string;
    required?: boolean;
    error?: string;
    children: React.ReactElement;
}> = ({ label, required = false, error, children }) => {
    const fieldId = useId();
    const errorId = useId();
    
    return (
        <div className="form-field">
            <label htmlFor={fieldId} className="form-label">
                {label}
                {required && <span aria-label="required">*</span>}
            </label>
            {React.cloneElement(children, {
                id: fieldId,
                'aria-invalid': !!error,
                'aria-describedby': error ? errorId : undefined,
                required
            })}
            {error && (
                <div id={errorId} className="form-error" role="alert">
                    {error}
                </div>
            )}
        </div>
    );
};
```

### Screen Reader Support

```typescript
// Live region for announcements
const useScreenReaderAnnouncements = () => {
    const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', priority);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            if (document.body.contains(announcement)) {
                document.body.removeChild(announcement);
            }
        }, 1000);
    }, []);
    
    return { announce };
};

// Skip navigation links
const SkipNavigation: React.FC = () => (
    <div className="skip-navigation">
        <a href="#main-content" className="skip-link">
            Skip to main content
        </a>
        <a href="#sidebar-navigation" className="skip-link">
            Skip to navigation
        </a>
    </div>
);
```

## Testing Patterns

### Component Testing

```typescript
// Component test utilities
const renderWithTheme = (component: React.ReactElement) => {
    return render(
        <ThemeProvider theme={dadmsTheme}>
            <AppProvider>
                {component}
            </AppProvider>
        </ThemeProvider>
    );
};

// Example component test
describe('ProjectCard', () => {
    const mockProject: Project = {
        id: 'test-project',
        name: 'Test Project',
        description: 'A test project',
        status: 'active',
        priority: 'medium',
        createdAt: new Date().toISOString()
    };
    
    it('renders project information correctly', () => {
        const onSelect = jest.fn();
        
        renderWithTheme(
            <ProjectCard project={mockProject} onSelect={onSelect} />
        );
        
        expect(screen.getByText('Test Project')).toBeInTheDocument();
        expect(screen.getByText('A test project')).toBeInTheDocument();
    });
    
    it('handles selection correctly', async () => {
        const onSelect = jest.fn();
        const user = userEvent.setup();
        
        renderWithTheme(
            <ProjectCard project={mockProject} onSelect={onSelect} />
        );
        
        await user.click(screen.getByTestId('project-card'));
        
        expect(onSelect).toHaveBeenCalledWith('test-project');
    });
    
    it('meets accessibility requirements', async () => {
        const onSelect = jest.fn();
        
        const { container } = renderWithTheme(
            <ProjectCard project={mockProject} onSelect={onSelect} />
        );
        
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
```

### Hook Testing

```typescript
describe('useProjects', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    
    it('loads projects successfully', async () => {
        const mockProjects = [mockProject];
        jest.spyOn(projectApi, 'getProjects').mockResolvedValue(mockProjects);
        
        const { result } = renderHook(() => useProjects());
        
        act(() => {
            result.current.loadProjects();
        });
        
        await waitFor(() => {
            expect(result.current.projects).toEqual(mockProjects);
            expect(result.current.loading).toBe(false);
        });
    });
    
    it('handles errors correctly', async () => {
        const error = new Error('Failed to load projects');
        jest.spyOn(projectApi, 'getProjects').mockRejectedValue(error);
        
        const { result } = renderHook(() => useProjects());
        
        act(() => {
            result.current.loadProjects();
        });
        
        await waitFor(() => {
            expect(result.current.error).toBe('Failed to load projects');
            expect(result.current.loading).toBe(false);
        });
    });
});
```

## Development Workflow

### Component Development Checklist

- [ ] **TypeScript interfaces** defined for all props
- [ ] **Accessibility** attributes (ARIA labels, roles, keyboard navigation)
- [ ] **Error handling** for all async operations
- [ ] **Loading states** for data fetching
- [ ] **Responsive design** for different screen sizes
- [ ] **Unit tests** with adequate coverage
- [ ] **Storybook stories** for component documentation
- [ ] **Performance optimization** (memoization, lazy loading)
- [ ] **Documentation** with usage examples
- [ ] **Code review** by team members

### Performance Monitoring

```typescript
// Performance monitoring hook
const usePerformanceMonitoring = (componentName: string) => {
    useEffect(() => {
        const startTime = performance.now();
        
        return () => {
            const endTime = performance.now();
            const renderTime = endTime - startTime;
            
            if (renderTime > 16) { // Warn if render takes longer than 1 frame
                console.warn(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
            }
        };
    });
};

// Usage in components
const ProjectDashboard: React.FC = () => {
    usePerformanceMonitoring('ProjectDashboard');
    // Component implementation
};
```

This comprehensive component guidelines document provides the foundation for consistent, accessible, and performant UI development in DADMS 2.0. 