'use client';

import React from 'react';
import { Icon } from './Icon';

export interface LoadingStateProps {
    text?: string;
    size?: 'sm' | 'md' | 'lg';
    fullScreen?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
    text = 'Loading...',
    size = 'md',
    fullScreen = false,
}) => {
    const sizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
    };

    const iconSize = size === 'sm' ? 'md' : size === 'md' ? 'lg' : 'xl';

    const content = (
        <div className="flex flex-col items-center justify-center p-8">
            <Icon
                name="loading"
                size={iconSize}
                className="animate-spin text-blue-500 mb-4"
            />
            <span className={`text-gray-400 ${sizeClasses[size]}`}>{text}</span>
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
                {content}
            </div>
        );
    }

    return content;
};

// Skeleton loader for content placeholders
export interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
    animation?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'text',
    width,
    height,
    animation = true,
}) => {
    const baseClasses = 'bg-gray-700';

    const variantClasses = {
        text: 'h-4 rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-none',
        rounded: 'rounded-lg',
    };

    const animationClass = animation ? 'animate-pulse' : '';

    const style: React.CSSProperties = {
        width: width || (variant === 'text' ? '100%' : undefined),
        height: height || (variant === 'circular' ? width : undefined),
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${animationClass} ${className}`}
            style={style}
        />
    );
};

// Composite skeleton loaders for common patterns
export const SkeletonCard: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
    <div className="p-6 space-y-4">
        <div className="flex items-center gap-4">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="flex-1 space-y-2">
                <Skeleton width="60%" />
                <Skeleton width="40%" />
            </div>
        </div>
        <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton key={i} width={i === lines - 1 ? '80%' : '100%'} />
            ))}
        </div>
    </div>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({
    rows = 5,
    cols = 4
}) => (
    <div className="space-y-2">
        {/* Header */}
        <div className="flex gap-4 p-4 border-b border-gray-700">
            {Array.from({ length: cols }).map((_, i) => (
                <Skeleton key={i} width={`${100 / cols}%`} height={20} />
            ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex gap-4 p-4">
                {Array.from({ length: cols }).map((_, colIndex) => (
                    <Skeleton
                        key={colIndex}
                        width={`${100 / cols}%`}
                        height={16}
                    />
                ))}
            </div>
        ))}
    </div>
);

export const SkeletonList: React.FC<{ items?: number }> = ({ items = 5 }) => (
    <div className="space-y-4">
        {Array.from({ length: items }).map((_, i) => (
            <SkeletonCard key={i} lines={2} />
        ))}
    </div>
); 