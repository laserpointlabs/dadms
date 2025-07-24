'use client';

import React, { useEffect, useRef } from 'react';
import { browserSafeEditorOptions, configureMonacoForBrowser } from '../lib/monaco-config';

interface VSCodeEditorProps {
    value?: string;
    placeholder?: string;
    language?: string;
    readOnly?: boolean;
    onChange?: (value: string) => void;
    className?: string;
}

export const VSCodeEditor: React.FC<VSCodeEditorProps> = ({
    value = '',
    placeholder = '// Start coding here...',
    language = 'typescript',
    readOnly = false,
    onChange,
    className = ''
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const monacoEditorRef = useRef<any>(null);
    const isEditorInitialized = useRef(false);

    // Initialize Monaco Editor
    useEffect(() => {
        if (!editorRef.current || typeof window === 'undefined' || isEditorInitialized.current) return;

        // Dynamic import to avoid SSR issues
        import('monaco-editor').then((monaco) => {
            if (!editorRef.current || isEditorInitialized.current) return;

            try {
                // Configure Monaco Editor for browser environment
                configureMonacoForBrowser();

                // Configure Monaco Editor theme to match VSCode
                monaco.editor.defineTheme('vs-dark-dadms', {
                    base: 'vs-dark',
                    inherit: true,
                    rules: [],
                    colors: {
                        'editor.background': '#1e1e1e',
                        'editor.foreground': '#d4d4d4',
                        'editorLineNumber.foreground': '#6e7681',
                        'editorLineNumber.activeForeground': '#ffffff',
                        'editor.selectionBackground': '#264f78',
                        'editor.selectionHighlightBackground': '#3a3d41',
                        'editorCursor.foreground': '#ffffff',
                        'editor.findMatchBackground': '#515c6a',
                        'editor.findMatchHighlightBackground': '#ea5c004d',
                        'editor.wordHighlightBackground': '#575757b8',
                        'editor.wordHighlightStrongBackground': '#004972b8',
                        'editorBracketMatch.background': '#0064001a',
                        'editorBracketMatch.border': '#888888'
                    }
                });

                // Create the editor with browser-safe configuration
                const editor = monaco.editor.create(editorRef.current, {
                    value: value || placeholder,
                    language: language,
                    theme: 'vs-dark-dadms',
                    readOnly: readOnly,
                    ...browserSafeEditorOptions
                });

                monacoEditorRef.current = editor;
                isEditorInitialized.current = true;

                // Add onChange listener
                if (onChange) {
                    editor.onDidChangeModelContent(() => {
                        onChange(editor.getValue());
                    });
                }
            } catch (error) {
                console.warn('Failed to initialize Monaco Editor:', error);
            }
        }).catch((error) => {
            console.warn('Failed to load Monaco Editor:', error);
        });

        // Cleanup on unmount
        return () => {
            if (monacoEditorRef.current && isEditorInitialized.current) {
                try {
                    monacoEditorRef.current.dispose();
                    isEditorInitialized.current = false;
                } catch (error) {
                    console.warn('Error disposing Monaco Editor:', error);
                }
            }
        };
    }, [language, readOnly, onChange, value, placeholder]);

    // Update editor value when prop changes
    useEffect(() => {
        if (monacoEditorRef.current && value !== undefined && typeof window !== 'undefined' && isEditorInitialized.current) {
            try {
                const currentValue = monacoEditorRef.current.getValue();
                if (currentValue !== value) {
                    monacoEditorRef.current.setValue(value);
                }
            } catch (error) {
                console.warn('Error updating Monaco Editor value:', error);
            }
        }
    }, [value]);

    return (
        <div
            ref={editorRef}
            className={`vscode-editor-container ${className}`}
            style={{
                width: '100%',
                height: '100%',
                minHeight: '300px',
                border: '1px solid var(--theme-border-primary)',
                borderRadius: '4px',
                overflow: 'hidden'
            }}
        />
    );
}; 