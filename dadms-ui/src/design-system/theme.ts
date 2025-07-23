/**
 * DADMS Design System Theme
 * Provides consistent colors, spacing, and typography based on VS Code aesthetic
 */

export const dadmsTheme = {
    colors: {
        // Background colors using CSS variables that respond to theme changes
        background: {
            primary: 'var(--theme-bg-primary)',      // Editor background
            secondary: 'var(--theme-bg-secondary)',    // Sidebar background
            tertiary: 'var(--theme-bg-tertiary)',     // Activity bar background
            elevated: 'var(--theme-bg-elevated)',     // Elevated surfaces (modals, dropdowns)
            hover: 'var(--theme-bg-hover)',        // Hover state
            selection: 'var(--theme-bg-selection)',    // Selection background
        },

        // Text colors
        text: {
            primary: 'var(--theme-text-primary)',      // Primary text
            secondary: 'var(--theme-text-secondary)',    // Secondary text
            muted: 'var(--theme-text-muted)',        // Muted/disabled text
            inverse: 'var(--theme-text-inverse)',      // Text on light backgrounds
            link: 'var(--theme-text-link)',         // Link color
        },

        // Accent colors
        accent: {
            primary: 'var(--theme-accent-primary)',      // VS Code blue
            secondary: 'var(--theme-accent-secondary)',    // Lighter blue
            success: 'var(--theme-accent-success)',      // Green
            warning: 'var(--theme-accent-warning)',      // Orange
            error: 'var(--theme-accent-error)',        // Red
            info: 'var(--theme-accent-info)',         // Info blue
        },

        // Border colors
        border: {
            default: 'var(--theme-border)',      // Default border
            light: 'var(--theme-border-light)',        // Light border
            focus: 'var(--theme-border-focus)',        // Focus border
        },

        // Status colors
        status: {
            active: 'var(--theme-status-active)',
            inactive: 'var(--theme-status-inactive)',
            pending: 'var(--theme-status-pending)',
            error: 'var(--theme-status-error)',
        }
    },

    // Spacing system (4px base)
    spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
    },

    // Typography
    typography: {
        fontFamily: {
            default: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
        },

        fontSize: {
            xs: '11px',
            sm: '13px',
            md: '14px',
            lg: '16px',
            xl: '20px',
            xxl: '24px',
            xxxl: '32px',
        },

        fontWeight: {
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
        },

        lineHeight: {
            tight: 1.2,
            normal: 1.5,
            relaxed: 1.75,
        }
    },

    // Border radius
    borderRadius: {
        none: '0px',
        sm: '2px',
        md: '4px',
        lg: '6px',
        xl: '8px',
        full: '9999px',
    },

    // Shadows
    shadows: {
        none: 'none',
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        md: '0 2px 8px 0 rgba(0, 0, 0, 0.4)',
        lg: '0 4px 16px 0 rgba(0, 0, 0, 0.5)',
        xl: '0 8px 24px 0 rgba(0, 0, 0, 0.6)',
    },

    // Z-index layers
    zIndex: {
        base: 0,
        elevated: 10,
        dropdown: 1000,
        sticky: 1100,
        modal: 1200,
        popover: 1300,
        tooltip: 1400,
        notification: 1500,
    },

    // Transitions
    transitions: {
        fast: '150ms ease-in-out',
        normal: '250ms ease-in-out',
        slow: '350ms ease-in-out',
    },

    // Breakpoints
    breakpoints: {
        xs: '480px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        xxl: '1536px',
    }
};

// Type definitions for TypeScript
export type Theme = typeof dadmsTheme;
export type ColorScheme = keyof typeof dadmsTheme.colors;
export type ThemeColor = keyof typeof dadmsTheme.colors.accent; 