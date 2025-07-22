/**
 * Shared Component Library
 * Export all reusable components from a single location
 */

export { Button } from './Button';
export type { ButtonProps } from './Button';

export { Card } from './Card';
export type { CardProps } from './Card';

export { Icon } from './Icon';
export type { CodiconName, IconProps } from './Icon';

export { LoadingState, Skeleton, SkeletonCard, SkeletonList, SkeletonTable } from './LoadingState';
export type { LoadingStateProps, SkeletonProps } from './LoadingState';

export { FormField, Input, Select, TextArea, useFormField } from './FormField';
export type { FormFieldProps, InputProps, SelectProps, TextAreaProps } from './FormField';

export { Alert, AlertDialog, Toast } from './Alert';
export type { AlertDialogProps, AlertProps, ToastProps } from './Alert';

export { ErrorBoundary, useErrorHandler, withErrorBoundary } from './ErrorBoundary';

export { PageContent, PageLayout } from './PageLayout';
export type { PageContentProps, PageLayoutProps } from './PageLayout';

export { ThemeToggle } from './ThemeToggle';
export type { ThemeToggleProps } from './ThemeToggle';

export { ThemeSelector } from './ThemeSelector';
export type { ThemeSelectorProps } from './ThemeSelector';

// TODO: Add these components
// export { DataTable } from './DataTable';
// export { StatusBadge } from './StatusBadge';
// export { Tabs } from './Tabs'; 