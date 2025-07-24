'use client';

import React from 'react';
import { CodiconName, Icon } from './Icon';

export type AlertVariant = 'error' | 'warning' | 'info' | 'success';

export interface AlertProps {
    variant: AlertVariant;
    title?: string;
    children: React.ReactNode;
    onClose?: () => void;
    className?: string;
    icon?: boolean;
    actions?: React.ReactNode;
}

const alertConfig: Record<AlertVariant, { icon: CodiconName; bgColor: string; borderColor: string; textColor: string; iconColor: string }> = {
    error: {
        icon: 'error',
        bgColor: 'bg-theme-accent-error bg-opacity-20',
        borderColor: 'border-theme-accent-error border-opacity-30',
        textColor: 'text-theme-accent-error',
        iconColor: 'text-theme-accent-error'
    },
    warning: {
        icon: 'warning',
        bgColor: 'bg-theme-accent-warning bg-opacity-20',
        borderColor: 'border-theme-accent-warning border-opacity-30',
        textColor: 'text-theme-accent-warning',
        iconColor: 'text-theme-accent-warning'
    },
    info: {
        icon: 'info',
        bgColor: 'bg-theme-accent-info bg-opacity-20',
        borderColor: 'border-theme-accent-info border-opacity-30',
        textColor: 'text-theme-accent-info',
        iconColor: 'text-theme-accent-info'
    },
    success: {
        icon: 'check',
        bgColor: 'bg-theme-accent-success bg-opacity-20',
        borderColor: 'border-theme-accent-success border-opacity-30',
        textColor: 'text-theme-accent-success',
        iconColor: 'text-theme-accent-success'
    }
};

export const Alert: React.FC<AlertProps> = ({
    variant,
    title,
    children,
    onClose,
    className = '',
    icon = true,
    actions
}) => {
    const config = alertConfig[variant];

    return (
        <div
            className={`
                rounded-lg border p-4
                ${config.bgColor} ${config.borderColor}
                ${className}
            `}
            role="alert"
        >
            <div className="flex items-start">
                {icon && (
                    <Icon
                        name={config.icon}
                        size="md"
                        className={`${config.iconColor} flex-shrink-0 mt-0.5`}
                    />
                )}

                <div className={`flex-1 ${icon ? 'ml-3' : ''}`}>
                    {title && (
                        <h3 className={`text-sm font-medium ${config.textColor} mb-1`}>
                            {title}
                        </h3>
                    )}

                    <div className={`text-sm ${config.textColor} ${title ? 'opacity-90' : ''}`}>
                        {children}
                    </div>

                    {actions && (
                        <div className="mt-3">
                            {actions}
                        </div>
                    )}
                </div>

                {onClose && (
                    <button
                        onClick={onClose}
                        className={`
                            ml-4 flex-shrink-0 rounded-sm
                            ${config.textColor} hover:opacity-75
                            focus:outline-none focus:ring-2 focus:ring-offset-2
                            focus:ring-offset-gray-800 focus:ring-${variant === 'error' ? 'red' : variant === 'warning' ? 'yellow' : variant === 'success' ? 'green' : 'blue'}-500
                        `}
                        aria-label="Close alert"
                    >
                        <Icon name="close" size="sm" />
                    </button>
                )}
            </div>
        </div>
    );
};

// Toast notification variant
export interface ToastProps extends Omit<AlertProps, 'className'> {
    duration?: number;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const Toast: React.FC<ToastProps> = ({
    duration = 5000,
    position = 'top-right',
    onClose,
    ...alertProps
}) => {
    React.useEffect(() => {
        if (duration && onClose) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const positionClasses = {
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4',
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4'
    };

    return (
        <div className={`fixed ${positionClasses[position]} z-50 max-w-sm animate-slide-in`}>
            <Alert {...alertProps} onClose={onClose} className="shadow-lg" />
        </div>
    );
};

// Alert dialog for important messages
export interface AlertDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: AlertVariant;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'info'
}) => {
    if (!open) return null;

    const config = alertConfig[variant];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-black bg-opacity-50"
                onClick={onClose}
                aria-hidden="true"
            />

            <div className="relative bg-theme-surface rounded-lg shadow-xl max-w-md w-full p-6 border border-theme-border">
                <div className="flex items-start mb-4">
                    <Icon
                        name={config.icon}
                        size="lg"
                        className={`${config.iconColor} mr-3`}
                    />
                    <div>
                        <h3 className="text-lg font-medium text-theme-text-primary mb-2">
                            {title}
                        </h3>
                        <p className="text-sm text-theme-text-secondary">
                            {description}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-theme-text-secondary bg-theme-surface-hover rounded hover:bg-theme-bg-hover focus:outline-none focus:ring-2 focus:ring-theme-accent-primary"
                    >
                        {cancelText}
                    </button>
                    {onConfirm && (
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`
                                px-4 py-2 text-sm font-medium rounded
                                focus:outline-none focus:ring-2
                                ${variant === 'error'
                                    ? 'bg-theme-accent-error hover:opacity-90 text-theme-text-inverse focus:ring-theme-accent-error'
                                    : variant === 'warning'
                                        ? 'bg-theme-accent-warning hover:opacity-90 text-theme-text-inverse focus:ring-theme-accent-warning'
                                        : variant === 'success'
                                            ? 'bg-theme-accent-success hover:opacity-90 text-theme-text-inverse focus:ring-theme-accent-success'
                                            : 'bg-theme-accent-primary hover:opacity-90 text-theme-text-inverse focus:ring-theme-accent-primary'
                                }
                            `}
                        >
                            {confirmText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}; 