'use client';

import React from 'react';
import { CodiconName, Icon } from './Icon';

export interface ButtonProps {
    children?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
    leftIcon?: CodiconName;
    rightIcon?: CodiconName;
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
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${fullWidth ? 'w-full' : ''}
    `;

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm rounded-md',
        md: 'px-4 py-2 text-sm rounded-md',
        lg: 'px-6 py-3 text-base rounded-lg',
    };

    const variantClasses = {
        primary: `
            bg-theme-accent-primary hover:opacity-90 text-theme-text-inverse
            focus:ring-theme-accent-primary focus:ring-offset-theme-bg-primary
            border border-transparent
        `,
        secondary: `
            bg-theme-surface hover:bg-theme-surface-hover text-theme-text-primary
            focus:ring-theme-accent-primary focus:ring-offset-theme-bg-primary
            border border-theme-border-light hover:border-theme-border-focus
        `,
        tertiary: `
            bg-transparent hover:bg-theme-surface text-theme-text-secondary hover:text-theme-text-primary
            focus:ring-theme-accent-primary focus:ring-offset-theme-bg-primary
            border border-transparent hover:border-theme-border-light
        `,
        danger: `
            bg-theme-accent-error hover:opacity-90 text-theme-text-inverse
            focus:ring-theme-accent-error focus:ring-offset-theme-bg-primary
            border border-transparent
        `,
        success: `
            bg-theme-accent-success hover:opacity-90 text-theme-text-inverse
            focus:ring-theme-accent-success focus:ring-offset-theme-bg-primary
            border border-transparent
        `,
    };

    const isDisabled = disabled || loading;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={isDisabled}
            className={`
                ${baseClasses}
                ${sizeClasses[size]}
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