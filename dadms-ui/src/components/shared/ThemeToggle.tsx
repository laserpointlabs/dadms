'use client';

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from './Button';
import { Icon } from './Icon';

export interface ThemeToggleProps {
    variant?: 'button' | 'icon';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
    variant = 'icon',
    size = 'md',
    className = ''
}) => {
    const { theme, toggleTheme } = useTheme();

    if (variant === 'button') {
        return (
            <Button
                variant="tertiary"
                size={size}
                leftIcon={theme === 'dark' ? 'lightbulb' : 'circle-filled'}
                onClick={toggleTheme}
                className={className}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
                {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
            </Button>
        );
    }

    return (
        <button
            onClick={toggleTheme}
            className={`
                inline-flex items-center justify-center
                w-8 h-8 rounded-md
                bg-theme-surface hover:bg-theme-surface-hover
                border border-theme-border hover:border-theme-border-light
                text-theme-text-secondary hover:text-theme-text-primary
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-theme-accent-primary focus:ring-offset-2
                focus:ring-offset-theme-background-primary
                ${className}
            `}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
            <Icon
                name={theme === 'dark' ? 'lightbulb' : 'circle-filled'}
                size={size}
                className="transition-transform duration-200"
            />
        </button>
    );
}; 