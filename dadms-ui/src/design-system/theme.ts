/**
 * DADMS Design System Theme
 * Provides consistent colors, spacing, and typography based on VS Code aesthetic
 */

export const dadmsTheme = {
    colors: {
        // Background colors matching VS Code dark theme
        background: {
            primary: '#1e1e1e',      // Editor background
            secondary: '#252526',    // Sidebar background
            tertiary: '#333333',     // Activity bar background
            elevated: '#2d2d30',     // Elevated surfaces (modals, dropdowns)
            hover: '#2a2d2e',        // Hover state
            selection: '#264f78',    // Selection background
        },

        // Text colors
        text: {
            primary: '#d4d4d4',      // Primary text
            secondary: '#cccccc',    // Secondary text
            muted: '#6e7681',        // Muted/disabled text
            inverse: '#1e1e1e',      // Text on light backgrounds
            link: '#3794ff',         // Link color
        },

        // Accent colors
        accent: {
            primary: '#007acc',      // VS Code blue
            secondary: '#3794ff',    // Lighter blue
            success: '#4caf50',      // Green
            warning: '#ff9800',      // Orange
            error: '#f44336',        // Red
            info: '#2196f3',         // Info blue
        },

        // Border colors
        border: {
            default: '#2d2d30',      // Default border
            light: '#464647',        // Light border
            focus: '#007acc',        // Focus border
        },

        // Status colors
        status: {
            active: '#4caf50',
            inactive: '#6e7681',
            pending: '#ff9800',
            error: '#f44336',
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