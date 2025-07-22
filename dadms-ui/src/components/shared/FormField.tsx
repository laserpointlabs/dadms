'use client';

import React from 'react';

export interface FormFieldProps {
    label: string;
    error?: string | string[];
    required?: boolean;
    helpText?: string;
    children: React.ReactElement<any>;
    className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
    label,
    error,
    required = false,
    helpText,
    children,
    className = ''
}) => {
    const errorMessage = Array.isArray(error) ? error[0] : error;
    const hasError = !!errorMessage;

    // Clone the child element and add error styling
    const childProps = (children as React.ReactElement).props;

    return (
        <div className={`space-y-2 ${className}`}>
            <label className="block text-sm font-medium text-theme-text-secondary">
                {label}
                {required && <span className="text-theme-accent-error ml-1">*</span>}
            </label>

            {children}

            {helpText && (
                <p id={`${label}-help`} className="text-xs text-theme-text-muted mt-1">
                    {helpText}
                </p>
            )}

            {error && (
                <p className="text-xs text-theme-accent-error mt-1">{error}</p>
            )}
        </div>
    );
};

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
}

export const Input: React.FC<InputProps> = ({
    error,
    className = '',
    ...props
}) => (
    <input
        className={`
            w-full bg-theme-input-bg border rounded px-3 py-2 text-theme-text-primary
            focus:outline-none focus:ring-2 focus:ring-theme-accent-primary focus:ring-offset-1
            ${error ? 'border-theme-accent-error focus:border-theme-accent-error' : 'border-theme-input-border focus:border-theme-border-focus'}
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-200
            ${className}
        `}
        {...props}
    />
);

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({
    error,
    className = '',
    ...props
}) => (
    <textarea
        className={`
            w-full bg-theme-input-bg border rounded px-3 py-2 text-theme-text-primary
            focus:outline-none focus:ring-2 focus:ring-theme-accent-primary focus:ring-offset-1
            ${error ? 'border-theme-accent-error focus:border-theme-accent-error' : 'border-theme-input-border focus:border-theme-border-focus'}
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-200
            resize-vertical
            ${className}
        `}
        {...props}
    />
);

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    error?: boolean;
    children?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
    error,
    className = '',
    children,
    ...props
}) => (
    <select
        className={`
            w-full bg-theme-input-bg border rounded px-3 py-2 text-theme-text-primary
            focus:outline-none focus:ring-2 focus:ring-theme-accent-primary focus:ring-offset-1
            ${error ? 'border-theme-accent-error focus:border-theme-accent-error' : 'border-theme-input-border focus:border-theme-border-focus'}
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-200
            ${className}
        `}
        {...props}
    >
        {children}
    </select>
);

// Hook for form field validation
export function useFormField(
    initialValue: string = '',
    validators: Array<(value: string) => string | null> = []
) {
    const [value, setValue] = React.useState(initialValue);
    const [error, setError] = React.useState<string | null>(null);
    const [touched, setTouched] = React.useState(false);

    const validate = React.useCallback(() => {
        for (const validator of validators) {
            const error = validator(value);
            if (error) {
                setError(error);
                return false;
            }
        }
        setError(null);
        return true;
    }, [value, validators]);

    React.useEffect(() => {
        if (touched) {
            validate();
        }
    }, [value, touched, validate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setValue(e.target.value);
    };

    const handleBlur = () => {
        setTouched(true);
        validate();
    };

    return {
        value,
        error: touched ? error : null,
        onChange: handleChange,
        onBlur: handleBlur,
        validate,
        reset: () => {
            setValue(initialValue);
            setError(null);
            setTouched(false);
        }
    };
} 