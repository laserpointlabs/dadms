// Form validation utilities for DADMS

export interface ValidationRule {
    validate: (value: any) => boolean;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

// Common validation rules
export const validators = {
    required: (message = 'This field is required'): ValidationRule => ({
        validate: (value: any) => {
            if (typeof value === 'string') return value.trim().length > 0;
            if (Array.isArray(value)) return value.length > 0;
            return value != null && value !== '';
        },
        message
    }),

    minLength: (min: number, message?: string): ValidationRule => ({
        validate: (value: string) => !!value && value.length >= min,
        message: message || `Must be at least ${min} characters`
    }),

    maxLength: (max: number, message?: string): ValidationRule => ({
        validate: (value: string) => !value || value.length <= max,
        message: message || `Must be no more than ${max} characters`
    }),

    pattern: (pattern: RegExp, message = 'Invalid format'): ValidationRule => ({
        validate: (value: string) => !value || pattern.test(value),
        message
    }),

    email: (message = 'Invalid email address'): ValidationRule => ({
        validate: (value: string) => {
            if (!value) return true;
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailPattern.test(value);
        },
        message
    }),

    url: (message = 'Invalid URL'): ValidationRule => ({
        validate: (value: string) => {
            if (!value) return true;
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        },
        message
    }),

    alphanumeric: (message = 'Only letters and numbers allowed'): ValidationRule => ({
        validate: (value: string) => {
            if (!value) return true;
            return /^[a-zA-Z0-9]+$/.test(value);
        },
        message
    }),

    noSpecialChars: (message = 'Special characters not allowed'): ValidationRule => ({
        validate: (value: string) => {
            if (!value) return true;
            return /^[a-zA-Z0-9\s\-_]+$/.test(value);
        },
        message
    }),

    numeric: (message = 'Must be a number'): ValidationRule => ({
        validate: (value: any) => {
            if (!value) return true;
            return !isNaN(Number(value));
        },
        message
    }),

    min: (min: number, message?: string): ValidationRule => ({
        validate: (value: number) => value == null || value >= min,
        message: message || `Must be at least ${min}`
    }),

    max: (max: number, message?: string): ValidationRule => ({
        validate: (value: number) => value == null || value <= max,
        message: message || `Must be no more than ${max}`
    }),

    arrayMinLength: (min: number, message?: string): ValidationRule => ({
        validate: (value: any[]) => Array.isArray(value) && value.length >= min,
        message: message || `Select at least ${min} item${min > 1 ? 's' : ''}`
    }),

    arrayMaxLength: (max: number, message?: string): ValidationRule => ({
        validate: (value: any[]) => !value || (Array.isArray(value) && value.length <= max),
        message: message || `Select no more than ${max} item${max > 1 ? 's' : ''}`
    }),

    custom: (validate: (value: any) => boolean, message: string): ValidationRule => ({
        validate,
        message
    })
};

// Validate a single field
export function validateField(value: any, rules: ValidationRule[]): ValidationResult {
    const errors: string[] = [];

    for (const rule of rules) {
        if (!rule.validate(value)) {
            errors.push(rule.message);
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// Validate multiple fields
export function validateForm<T extends Record<string, any>>(
    data: T,
    schema: Partial<Record<keyof T, ValidationRule[]>>
): Record<keyof T, ValidationResult> {
    const results = {} as Record<keyof T, ValidationResult>;

    for (const [field, rules] of Object.entries(schema) as [keyof T, ValidationRule[]][]) {
        if (rules) {
            results[field] = validateField(data[field], rules);
        }
    }

    return results;
}

// Check if all fields are valid
export function isFormValid<T extends Record<string, any>>(
    validationResults: Record<keyof T, ValidationResult>
): boolean {
    return Object.values(validationResults).every(result =>
        (result as ValidationResult).isValid
    );
}

// Get all error messages
export function getFormErrors<T extends Record<string, any>>(
    validationResults: Record<keyof T, ValidationResult>
): Record<keyof T, string[]> {
    const errors = {} as Record<keyof T, string[]>;

    for (const [field, result] of Object.entries(validationResults) as [keyof T, ValidationResult][]) {
        if (!result.isValid) {
            errors[field] = result.errors;
        }
    }

    return errors;
}

// Common validation schemas
export const validationSchemas = {
    project: {
        name: [
            validators.required(),
            validators.minLength(3, 'Project name must be at least 3 characters'),
            validators.maxLength(100, 'Project name must be less than 100 characters'),
            validators.noSpecialChars('Project name cannot contain special characters')
        ],
        description: [
            validators.required(),
            validators.minLength(10, 'Description must be at least 10 characters'),
            validators.maxLength(500, 'Description must be less than 500 characters')
        ],
        knowledgeDomain: [
            validators.required('Knowledge domain is required'),
            validators.minLength(3, 'Knowledge domain must be at least 3 characters')
        ],
        decisionContext: [
            validators.required('Decision context is required'),
            validators.minLength(10, 'Decision context must be at least 10 characters')
        ],
        tags: [
            validators.arrayMaxLength(10, 'Maximum 10 tags allowed')
        ]
    },

    user: {
        email: [
            validators.required(),
            validators.email()
        ],
        name: [
            validators.required(),
            validators.minLength(2, 'Name must be at least 2 characters'),
            validators.pattern(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
        ],
        password: [
            validators.required(),
            validators.minLength(8, 'Password must be at least 8 characters'),
            validators.pattern(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                'Password must contain uppercase, lowercase, number, and special character'
            )
        ]
    }
}; 