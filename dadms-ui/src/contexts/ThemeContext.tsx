'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

// Theme types
export type ThemeMode = 'light' | 'dark';

export interface ThemeContextType {
    theme: ThemeMode;
    toggleTheme: () => void;
    setTheme: (theme: ThemeMode) => void;
}

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Custom hook to use theme
export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        // Return a fallback instead of throwing an error
        console.warn('useTheme: No ThemeProvider found, using fallback values');
        return {
            theme: 'dark',
            toggleTheme: () => console.warn('Cannot toggle theme without ThemeProvider'),
            setTheme: () => console.warn('Cannot set theme without ThemeProvider')
        };
    }
    return context;
};

// Theme provider component
export interface ThemeProviderProps {
    children: React.ReactNode;
    defaultTheme?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
    children,
    defaultTheme = 'dark'
}) => {
    // Initialize theme immediately from localStorage/system preference
    const getInitialTheme = (): ThemeMode => {
        if (typeof window === 'undefined') return defaultTheme;

        const savedTheme = localStorage.getItem('dadms-theme') as ThemeMode;
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
            return savedTheme;
        }

        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        return systemTheme;
    };

    const [theme, setThemeState] = useState<ThemeMode>(defaultTheme); // Start with default to avoid hydration issues
    const [mounted, setMounted] = useState(false);

    // Apply theme immediately on mount and when theme changes
    useEffect(() => {
        const applyTheme = (themeToApply: ThemeMode) => {
            const root = document.documentElement;

            // Remove any existing theme classes/attributes
            root.classList.remove('light', 'dark');
            root.removeAttribute('data-theme');

            // Apply new theme
            root.setAttribute('data-theme', themeToApply);
            root.classList.add(themeToApply);

            // Save to localStorage
            localStorage.setItem('dadms-theme', themeToApply);
        };

        // Initialize theme from localStorage or system preference on first load
        const initialTheme = getInitialTheme();
        if (initialTheme !== theme) {
            setThemeState(initialTheme);
        }

        // Apply theme immediately
        applyTheme(initialTheme);
        setMounted(true);
    }, []);



    // Listen for system theme changes
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            // Only update if no saved preference
            if (!localStorage.getItem('dadms-theme')) {
                setThemeState(e.matches ? 'dark' : 'light');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const toggleTheme = () => {
        setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const setTheme = (newTheme: ThemeMode) => {
        setThemeState(newTheme);
    };

    const value: ThemeContextType = {
        theme: mounted ? theme : defaultTheme, // Use default theme during SSR
        toggleTheme,
        setTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}; 