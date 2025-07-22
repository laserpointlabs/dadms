'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert } from './Alert';
import { Button } from './Button';

interface Props {
    children: ReactNode;
    fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to error reporting service
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        this.setState({
            error,
            errorInfo
        });
    }

    resetError = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError && this.state.error) {
            if (this.props.fallback) {
                return this.props.fallback(this.state.error, this.resetError);
            }

            return (
                <DefaultErrorFallback
                    error={this.state.error}
                    errorInfo={this.state.errorInfo}
                    resetError={this.resetError}
                />
            );
        }

        return this.props.children;
    }
}

interface DefaultErrorFallbackProps {
    error: Error;
    errorInfo: ErrorInfo | null;
    resetError: () => void;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({
    error,
    errorInfo,
    resetError
}) => {
    const [showDetails, setShowDetails] = React.useState(false);

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <Alert
                    variant="error"
                    title="Something went wrong"
                    actions={
                        <div className="flex gap-2 mt-4">
                            <Button
                                variant="primary"
                                size="sm"
                                leftIcon="refresh"
                                onClick={resetError}
                            >
                                Try Again
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                leftIcon="arrow-left"
                                onClick={() => window.location.href = '/'}
                            >
                                Go Home
                            </Button>
                        </div>
                    }
                >
                    <p className="mb-2">
                        An unexpected error occurred while rendering this page.
                        The error has been logged and our team will investigate.
                    </p>

                    {process.env.NODE_ENV === 'development' && (
                        <>
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className="text-red-400 hover:text-red-300 text-sm underline mt-2"
                            >
                                {showDetails ? 'Hide' : 'Show'} error details
                            </button>

                            {showDetails && (
                                <div className="mt-4 space-y-2">
                                    <div className="bg-gray-800 rounded p-3 border border-gray-700">
                                        <h4 className="text-sm font-medium text-gray-300 mb-1">
                                            Error Message:
                                        </h4>
                                        <pre className="text-xs text-red-400 overflow-auto">
                                            {error.message}
                                        </pre>
                                    </div>

                                    {error.stack && (
                                        <div className="bg-gray-800 rounded p-3 border border-gray-700">
                                            <h4 className="text-sm font-medium text-gray-300 mb-1">
                                                Stack Trace:
                                            </h4>
                                            <pre className="text-xs text-gray-400 overflow-auto max-h-48">
                                                {error.stack}
                                            </pre>
                                        </div>
                                    )}

                                    {errorInfo?.componentStack && (
                                        <div className="bg-gray-800 rounded p-3 border border-gray-700">
                                            <h4 className="text-sm font-medium text-gray-300 mb-1">
                                                Component Stack:
                                            </h4>
                                            <pre className="text-xs text-gray-400 overflow-auto max-h-48">
                                                {errorInfo.componentStack}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </Alert>
            </div>
        </div>
    );
};

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: (error: Error, resetError: () => void) => ReactNode
): React.ComponentType<P> {
    const WrappedComponent = (props: P) => (
        <ErrorBoundary fallback={fallback}>
            <Component {...props} />
        </ErrorBoundary>
    );

    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

    return WrappedComponent;
}

// Hook for error handling in functional components
export function useErrorHandler() {
    const [error, setError] = React.useState<Error | null>(null);

    React.useEffect(() => {
        if (error) {
            throw error;
        }
    }, [error]);

    return {
        resetError: () => setError(null),
        captureError: (error: Error) => setError(error)
    };
} 