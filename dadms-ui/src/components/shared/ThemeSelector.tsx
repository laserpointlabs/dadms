'use client';

import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from './Card';
import { Icon } from './Icon';

export interface ThemeSelectorProps {
    variant?: 'dropdown' | 'toggle' | 'panel';
    className?: string;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
    variant = 'toggle',
    className = ''
}) => {
    const { theme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    if (variant === 'toggle') {
        return (
            <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`
                    inline-flex items-center justify-center gap-2
                    w-10 h-8 rounded-md
                    bg-theme-surface hover:bg-theme-surface-hover
                    border border-theme-border hover:border-theme-border-light
                    text-theme-text-secondary hover:text-theme-text-primary
                    transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-theme-accent-primary focus:ring-offset-2
                    focus:ring-offset-theme-bg-primary
                    ${className}
                `}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
                <Icon
                    name={theme === 'dark' ? 'lightbulb' : 'circle-filled'}
                    size="sm"
                    className="transition-transform duration-200"
                />
            </button>
        );
    }

    if (variant === 'dropdown') {
        return (
            <div className={`relative ${className}`}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
                        inline-flex items-center justify-center gap-2
                        px-3 py-2 rounded-md
                        bg-theme-surface hover:bg-theme-surface-hover
                        border border-theme-border hover:border-theme-border-light
                        text-theme-text-secondary hover:text-theme-text-primary
                        transition-all duration-200
                        focus:outline-none focus:ring-2 focus:ring-theme-accent-primary focus:ring-offset-2
                        focus:ring-offset-theme-bg-primary
                    `}
                >
                    <Icon
                        name={theme === 'dark' ? 'circle-filled' : 'lightbulb'}
                        size="sm"
                    />
                    <span className="text-sm capitalize">{theme}</span>
                    <Icon name="chevron-down" size="sm" />
                </button>

                {isOpen && (
                    <div className="absolute top-full right-0 mt-1 z-50">
                        <Card variant="elevated" padding="sm" className="min-w-32">
                            <div className="space-y-1">
                                <button
                                    onClick={() => {
                                        setTheme('light');
                                        setIsOpen(false);
                                    }}
                                    className={`
                                        w-full flex items-center gap-2 px-3 py-2 rounded-md text-left
                                        hover:bg-theme-surface-hover transition-colors
                                        ${theme === 'light' ? 'bg-theme-accent-primary text-white' : 'text-theme-text-primary'}
                                    `}
                                >
                                    <Icon name="lightbulb" size="sm" />
                                    <span className="text-sm">Light</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setTheme('dark');
                                        setIsOpen(false);
                                    }}
                                    className={`
                                        w-full flex items-center gap-2 px-3 py-2 rounded-md text-left
                                        hover:bg-theme-surface-hover transition-colors
                                        ${theme === 'dark' ? 'bg-theme-accent-primary text-white' : 'text-theme-text-primary'}
                                    `}
                                >
                                    <Icon name="circle-filled" size="sm" />
                                    <span className="text-sm">Dark</span>
                                </button>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        );
    }

    // Panel variant
    return (
        <Card variant="default" padding="md" className={className}>
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-theme-text-primary">Theme Preference</h3>
                <p className="text-sm text-theme-text-secondary">
                    Choose your preferred color scheme for the interface.
                </p>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setTheme('light')}
                        className={`
                            p-4 rounded-lg border-2 transition-all duration-200
                            ${theme === 'light'
                                ? 'border-theme-accent-primary bg-theme-accent-primary bg-opacity-10'
                                : 'border-theme-border hover:border-theme-border-light bg-theme-surface hover:bg-theme-surface-hover'
                            }
                        `}
                    >
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="lightbulb" size="lg" className={theme === 'light' ? 'text-theme-accent-primary' : 'text-theme-text-secondary'} />
                            <span className={`text-sm font-medium ${theme === 'light' ? 'text-theme-accent-primary' : 'text-theme-text-primary'}`}>
                                Light
                            </span>
                        </div>
                    </button>

                    <button
                        onClick={() => setTheme('dark')}
                        className={`
                            p-4 rounded-lg border-2 transition-all duration-200
                            ${theme === 'dark'
                                ? 'border-theme-accent-primary bg-theme-accent-primary bg-opacity-10'
                                : 'border-theme-border hover:border-theme-border-light bg-theme-surface hover:bg-theme-surface-hover'
                            }
                        `}
                    >
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="circle-filled" size="lg" className={theme === 'dark' ? 'text-theme-accent-primary' : 'text-theme-text-secondary'} />
                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-theme-accent-primary' : 'text-theme-text-primary'}`}>
                                Dark
                            </span>
                        </div>
                    </button>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-theme-surface border border-theme-border">
                    <div className="flex items-center gap-2 text-sm text-theme-text-secondary">
                        <Icon name="info" size="sm" />
                        <span>Theme preference is saved automatically</span>
                    </div>
                </div>
            </div>
        </Card>
    );
}; 