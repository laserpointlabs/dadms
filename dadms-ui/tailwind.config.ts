import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: 'class', // Enable class-based dark mode
    theme: {
        extend: {
            colors: {
                // Theme-aware colors using CSS variables
                theme: {
                    'bg-primary': 'var(--theme-bg-primary)',
                    'bg-secondary': 'var(--theme-bg-secondary)',
                    'bg-tertiary': 'var(--theme-bg-tertiary)',
                    'surface': 'var(--theme-surface)',
                    'surface-hover': 'var(--theme-surface-hover)',
                    'surface-elevated': 'var(--theme-surface-elevated)',
                    'text-primary': 'var(--theme-text-primary)',
                    'text-secondary': 'var(--theme-text-secondary)',
                    'text-muted': 'var(--theme-text-muted)',
                    'text-link': 'var(--theme-text-link)',
                    'border': 'var(--theme-border)',
                    'border-light': 'var(--theme-border-light)',
                    'border-focus': 'var(--theme-border-focus)',
                    'accent-primary': 'var(--theme-accent-primary)',
                    'accent-secondary': 'var(--theme-accent-secondary)',
                    'accent-success': 'var(--theme-accent-success)',
                    'accent-warning': 'var(--theme-accent-warning)',
                    'accent-error': 'var(--theme-accent-error)',
                    'accent-info': 'var(--theme-accent-info)',
                    'input-bg': 'var(--theme-input-bg)',
                    'input-border': 'var(--theme-input-border)',
                }
            },
            fontFamily: {
                sans: [
                    '-apple-system',
                    'BlinkMacSystemFont',
                    '"Segoe UI"',
                    'Roboto',
                    '"Helvetica Neue"',
                    'Arial',
                    'sans-serif',
                ],
                mono: [
                    '"SF Mono"',
                    'Monaco',
                    '"Cascadia Code"',
                    '"Roboto Mono"',
                    'Consolas',
                    '"Courier New"',
                    'monospace',
                ],
            },
            transitionProperty: {
                'theme': 'background-color, border-color, color, fill, stroke',
            },
            animation: {
                'slide-in': 'slide-in 0.3s ease-out forwards',
            },
            keyframes: {
                'slide-in': {
                    'from': { transform: 'translateX(100%)', opacity: '0' },
                    'to': { transform: 'translateX(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
};

export default config; 