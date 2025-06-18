import { format, formatDistanceToNow, parseISO } from 'date-fns';

// Date utilities
export const formatDate = (date: string | Date, formatStr: string = 'PPpp'): string => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
};

export const formatRelativeTime = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
};

// File size utilities
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Number utilities
export const formatNumber = (num: number, decimals: number = 2): string => {
    return num.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

export const formatPercentage = (value: number, total: number, decimals: number = 1): string => {
    if (total === 0) return '0%';
    const percentage = (value / total) * 100;
    return `${percentage.toFixed(decimals)}%`;
};

// String utilities
export const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
};

export const capitalizeFirst = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

export const camelToTitle = (str: string): string => {
    return str
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (match) => match.toUpperCase())
        .trim();
};

// Status utilities
export const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'info' | 'default' => {
    const statusMap: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
        // Generic statuses
        'success': 'success',
        'completed': 'success',
        'active': 'success',
        'healthy': 'success',
        'running': 'info',
        'pending': 'warning',
        'warning': 'warning',
        'error': 'error',
        'failed': 'error',
        'unhealthy': 'error',
        'stopped': 'default',
        'inactive': 'default',

        // Analysis specific
        'analysis_completed': 'success',
        'analysis_running': 'info',
        'analysis_pending': 'warning',
        'analysis_failed': 'error',

        // Service specific
        'service_healthy': 'success',
        'service_unhealthy': 'error',
        'service_degraded': 'warning',
    };

    return statusMap[status.toLowerCase()] || 'default';
};

export const getStatusIcon = (status: string): string => {
    const statusMap: Record<string, string> = {
        'success': '✅',
        'completed': '✅',
        'active': '🟢',
        'healthy': '💚',
        'running': '🔄',
        'pending': '⏳',
        'warning': '⚠️',
        'error': '❌',
        'failed': '💥',
        'unhealthy': '🔴',
        'stopped': '⏹️',
        'inactive': '⚪',
    };

    return statusMap[status.toLowerCase()] || '❓';
};

// URL utilities
export const buildApiUrl = (endpoint: string, params?: Record<string, any>): string => {
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
    const url = new URL(endpoint, baseUrl);

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, String(value));
            }
        });
    }

    return url.toString();
};

// Local storage utilities
export const getFromStorage = (key: string, defaultValue?: any): any => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
    }
};

export const setToStorage = (key: string, value: any): void => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Error writing to localStorage:', error);
    }
};

export const removeFromStorage = (key: string): void => {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Error removing from localStorage:', error);
    }
};

// Error handling utilities
export const getErrorMessage = (error: any): string => {
    if (typeof error === 'string') return error;
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.response?.data?.error) return error.response.data.error;
    if (error?.message) return error.message;
    return 'An unexpected error occurred';
};

export const isNetworkError = (error: any): boolean => {
    return !error.response && error.request;
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const isValidUrl = (url: string): boolean => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

// Data transformation utilities
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
    return array.reduce((groups, item) => {
        const group = String(item[key]);
        if (!groups[group]) {
            groups[group] = [];
        }
        groups[group].push(item);
        return groups;
    }, {} as Record<string, T[]>);
};

export const sortBy = <T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
    return [...array].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });
};

export const filterBy = <T>(array: T[], filters: Partial<T>): T[] => {
    return array.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
            if (value === undefined || value === null) return true;
            return item[key as keyof T] === value;
        });
    });
};

// Search utilities
export const searchItems = <T>(
    items: T[],
    query: string,
    searchFields: (keyof T)[]
): T[] => {
    if (!query.trim()) return items;

    const lowercaseQuery = query.toLowerCase();

    return items.filter(item => {
        return searchFields.some(field => {
            const value = item[field];
            if (typeof value === 'string') {
                return value.toLowerCase().includes(lowercaseQuery);
            }
            if (typeof value === 'number') {
                return value.toString().includes(lowercaseQuery);
            }
            return false;
        });
    });
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void => {
    let timeout: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

// Color utilities
export const generateColorFromString = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
};

// Download utilities
export const downloadFile = (data: any, filename: string, type: string = 'application/json'): void => {
    const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// Copy to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return success;
    }
};
