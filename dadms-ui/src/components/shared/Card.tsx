'use client';

import React from 'react';

export interface CardProps {
    children: React.ReactNode;
    variant?: 'default' | 'elevated' | 'outlined';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    className?: string;
    onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
    children,
    variant = 'default',
    padding = 'md',
    className = '',
    onClick,
}) => {
    const baseClasses = `
        rounded-lg transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-lg' : ''}
    `;

    const variantClasses = {
        default: `
            bg-theme-surface border border-theme-border
            hover:border-theme-border-light
        `,
        elevated: `
            bg-theme-surface-elevated shadow-md
            hover:shadow-lg border border-theme-border
        `,
        outlined: `
            bg-transparent border-2 border-theme-border-light
            hover:border-theme-border-focus hover:bg-theme-surface
        `,
    };

    const paddingClasses = {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
    };

    return (
        <div
            className={`
                ${baseClasses}
                ${variantClasses[variant]}
                ${paddingClasses[padding]}
                ${className}
            `}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

export interface CardHeaderProps {
    children: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
    children,
    actions,
    className = '',
}) => (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
        <div className="flex-1">{children}</div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
);

export interface CardContentProps {
    children: React.ReactNode;
    className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({
    children,
    className = '',
}) => (
    <div className={className}>{children}</div>
);

export interface CardFooterProps {
    children: React.ReactNode;
    className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({
    children,
    className = '',
}) => (
    <div className={`mt-4 pt-4 border-t border-gray-700 ${className}`}>
        {children}
    </div>
); 