'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AgentAssistantContextType {
    isDocked: boolean;
    dockedHeight: number;
    setIsDocked: (docked: boolean) => void;
    setDockedHeight: (height: number) => void;
}

const AgentAssistantContext = createContext<AgentAssistantContextType | undefined>(undefined);

export const useAgentAssistant = (): AgentAssistantContextType => {
    const context = useContext(AgentAssistantContext);
    if (!context) {
        console.warn('useAgentAssistant: No AgentAssistantProvider found, using fallback values');
        return {
            isDocked: false,
            dockedHeight: 0,
            setIsDocked: () => { },
            setDockedHeight: () => { }
        };
    }
    return context;
};

export interface AgentAssistantProviderProps {
    children: React.ReactNode;
}

export const AgentAssistantProvider: React.FC<AgentAssistantProviderProps> = ({ children }) => {
    // Initialize from localStorage if available, otherwise default to false
    const getInitialDockState = (): boolean => {
        if (typeof window === 'undefined') return false;
        const saved = localStorage.getItem('dadms-agent-docked');
        return saved ? JSON.parse(saved) : false;
    };

    const getInitialHeight = (): number => {
        if (typeof window === 'undefined') return 280;
        const saved = localStorage.getItem('dadms-agent-height');
        return saved ? parseInt(saved, 10) : 280;
    };

    const [isDocked, setIsDockedState] = useState(getInitialDockState);
    const [dockedHeight, setDockedHeightState] = useState(getInitialHeight);
    const [mounted, setMounted] = useState(false);

    // Initialize from localStorage after mount to avoid hydration issues
    useEffect(() => {
        if (!mounted) {
            const initialDocked = getInitialDockState();
            const initialHeight = getInitialHeight();

            setIsDockedState(initialDocked);
            setDockedHeightState(initialHeight);
            setMounted(true);
        }
    }, [mounted]);

    // Persist to localStorage when state changes
    const setIsDocked = (docked: boolean) => {
        setIsDockedState(docked);
        if (typeof window !== 'undefined') {
            localStorage.setItem('dadms-agent-docked', JSON.stringify(docked));
        }
    };

    const setDockedHeight = (height: number) => {
        setDockedHeightState(height);
        if (typeof window !== 'undefined') {
            localStorage.setItem('dadms-agent-height', height.toString());
        }
    };

    const value: AgentAssistantContextType = {
        isDocked,
        dockedHeight,
        setIsDocked,
        setDockedHeight,
    };

    return (
        <AgentAssistantContext.Provider value={value}>
            {children}
        </AgentAssistantContext.Provider>
    );
}; 