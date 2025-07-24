'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useTabs } from '../../contexts/TabContext';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
}

class ErrorBoundaryClass extends Component<Props & { navigateToTab: (path: string) => void }, State> {
    constructor(props: Props & { navigateToTab: (path: string) => void }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ error, errorInfo });
    }

    handleGoHome = () => {
        this.props.navigateToTab('/');
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <div className="error-boundary-content">
                        <div className="error-boundary-icon">
                            <i className="codicon codicon-error"></i>
                        </div>
                        <h1 className="error-boundary-title">Something went wrong</h1>
                        <p className="error-boundary-message">
                            An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
                        </p>

                        {this.state.error && (
                            <details className="error-boundary-details">
                                <summary>Error Details</summary>
                                <div className="error-boundary-error">
                                    <h3>Error:</h3>
                                    <pre>{this.state.error.toString()}</pre>

                                    {this.state.errorInfo && (
                                        <>
                                            <h3>Component Stack:</h3>
                                            <pre>{this.state.errorInfo.componentStack}</pre>
                                        </>
                                    )}
                                </div>
                            </details>
                        )}

                        <div className="error-boundary-actions">
                            <button
                                className="error-boundary-button primary"
                                onClick={this.handleGoHome}
                            >
                                <i className="codicon codicon-home"></i>
                                Go to Home
                            </button>
                            <button
                                className="error-boundary-button secondary"
                                onClick={this.handleReload}
                            >
                                <i className="codicon codicon-refresh"></i>
                                Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Wrapper component to provide the navigateToTab function
export const ErrorBoundary: React.FC<Props> = ({ children }) => {
    const { navigateToTab } = useTabs();
    return <ErrorBoundaryClass navigateToTab={navigateToTab}>{children}</ErrorBoundaryClass>;
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