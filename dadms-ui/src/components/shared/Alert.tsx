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

const alertConfig: Record<AlertVariant, {
    icon: CodiconName;
    bgColor: string;
    borderColor: string;
    textColor: string;
    iconColor: string;
}> = {
    error: {
        icon: 'error',
        bgColor: 'bg-red-900 bg-opacity-20',
        borderColor: 'border-red-700',
        textColor: 'text-red-300',
        iconColor: 'text-red-400'
    },
    warning: {
        icon: 'warning',
        bgColor: 'bg-yellow-900 bg-opacity-20',
        borderColor: 'border-yellow-700',
        textColor: 'text-yellow-300',
        iconColor: 'text-yellow-400'
    },
    info: {
        icon: 'info',
        bgColor: 'bg-blue-900 bg-opacity-20',
        borderColor: 'border-blue-700',
        textColor: 'text-blue-300',
        iconColor: 'text-blue-400'
    },
    success: {
        icon: 'check-circle',
        bgColor: 'bg-green-900 bg-opacity-20',
        borderColor: 'border-green-700',
        textColor: 'text-green-300',
        iconColor: 'text-green-400'
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

            <div className="relative bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-700">
                <div className="flex items-start mb-4">
                    <Icon
                        name={config.icon}
                        size="lg"
                        className={`${config.iconColor} mr-3`}
                    />
                    <div>
                        <h3 className="text-lg font-medium text-gray-100 mb-2">
                            {title}
                        </h3>
                        <p className="text-sm text-gray-300">
                            {description}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
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
                                    ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
                                    : variant === 'warning'
                                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500'
                                        : variant === 'success'
                                            ? 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
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