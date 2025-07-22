'use client';

import React from 'react';
import { CodiconName, Icon } from './Icon';

export interface PageLayoutProps {
    title: string;
    subtitle?: string;
    icon?: CodiconName;
    actions?: React.ReactNode;
    status?: StatusInfo;
    children: React.ReactNode;
    loading?: boolean;
}

export interface StatusInfo {
    text: string;
    type: 'active' | 'inactive' | 'pending' | 'error';
}

const statusClasses = {
    active: 'text-theme-status-active',
    inactive: 'text-theme-status-inactive',
    pending: 'text-theme-status-pending',
    error: 'text-theme-status-error',
};

export const PageLayout: React.FC<PageLayoutProps> = ({
    title,
    subtitle,
    icon,
    actions,
    status,
    children
}) => {
    return (
        <div className="h-full flex flex-col bg-theme-bg-primary">
            {/* Page Header */}
            <div className="bg-theme-surface border-b border-theme-border px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {icon && <Icon name={icon} size="lg" className="text-theme-accent-primary" />}
                        <div>
                            <h1 className="text-2xl font-bold text-theme-text-primary">{title}</h1>
                            {subtitle && (
                                <p className="text-sm text-theme-text-secondary mt-1">{subtitle}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {status && (
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${status.type === 'active' ? 'bg-theme-status-active' : 'bg-theme-status-inactive'}`} />
                                <span className={`text-sm ${statusClasses[status.type]}`}>
                                    {status.text}
                                </span>
                            </div>
                        )}

                        {actions && (
                            <div className="flex items-center gap-2">
                                {actions}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Page Content */}
            <div className="flex-1 overflow-auto">
                {children}
            </div>
        </div>
    );
};

export interface PageContentProps {
    children: React.ReactNode;
    className?: string;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    spacing?: 'none' | 'sm' | 'md' | 'lg';
}

export const PageContent: React.FC<PageContentProps> = ({
    children,
    className = '',
    maxWidth = 'xl',
    padding = 'md',
    spacing = 'md'
}) => {
    const maxWidthClasses = {
        sm: 'max-w-2xl',
        md: 'max-w-4xl',
        lg: 'max-w-6xl',
        xl: 'max-w-7xl',
        full: 'max-w-full',
    };

    const paddingClasses = {
        none: '',
        sm: 'px-4 py-4',
        md: 'px-6 py-6',
        lg: 'px-8 py-8'
    };

    const spacingClasses = {
        none: '',
        sm: 'space-y-4',
        md: 'space-y-6',
        lg: 'space-y-8'
    };

    return (
        <div className={`
            ${maxWidthClasses[maxWidth]} 
            mx-auto 
            ${paddingClasses[padding]}
            ${spacingClasses[spacing]}
            ${className}
        `}>
            {children}
        </div>
    );
}; 