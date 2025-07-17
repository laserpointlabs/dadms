'use client';

import * as monaco from 'monaco-editor';
import { useEffect, useRef } from 'react';

interface VSCodeEditorProps {
    value?: string;
    language?: string;
    onChange?: (value: string) => void;
    readOnly?: boolean;
    placeholder?: string;
}

export default function VSCodeEditor({
    value = '',
    language = 'typescript',
    onChange,
    readOnly = false,
    placeholder = '// Welcome to DADMS 2.0\n// This Monaco Editor provides an authentic VSCode editing experience\n\nconst dadms = {\n    version: "2.0.0-alpha.2",\n    description: "Decision Analysis & Decision Management System",\n    features: [\n        "Project Management",\n        "Knowledge Base",\n        "LLM Playground",\n        "Context Manager",\n        "BPMN Workspace",\n        "Process Manager",\n        "Thread Manager",\n        "Decision Assistant"\n    ]\n};\n\nconsole.log("DADMS 2.0 - Professional decision intelligence platform");'
}: VSCodeEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

    useEffect(() => {
        if (!editorRef.current) return;

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

        // Create the editor
        const editor = monaco.editor.create(editorRef.current, {
            value: value || placeholder,
            language: language,
            theme: 'vs-dark-dadms',
            automaticLayout: true,
            minimap: {
                enabled: true,
                scale: 1
            },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineHeight: 22,
            fontFamily: 'Consolas, "Courier New", monospace',
            readOnly: readOnly,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            wordWrap: 'on',
            lineNumbers: 'on',
            glyphMargin: false,
            folding: true,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            renderWhitespace: 'selection',
            bracketPairColorization: {
                enabled: true
            }
        });

        monacoEditorRef.current = editor;

        // Add onChange listener
        if (onChange) {
            editor.onDidChangeModelContent(() => {
                onChange(editor.getValue());
            });
        }

        // Cleanup on unmount
        return () => {
            editor.dispose();
        };
    }, [language, readOnly, onChange]);

    // Update editor value when prop changes
    useEffect(() => {
        if (monacoEditorRef.current && value !== undefined) {
            const currentValue = monacoEditorRef.current.getValue();
            if (currentValue !== value) {
                monacoEditorRef.current.setValue(value);
            }
        }
    }, [value]);

    return (
        <div
            ref={editorRef}
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#1e1e1e'
            }}
        />
    );
} 