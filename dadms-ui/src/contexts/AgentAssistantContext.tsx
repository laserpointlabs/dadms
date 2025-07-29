'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AgentAssistantContextType {
    isDocked: boolean;
    dockedHeight: number;
    dockedWidth: number;
    dockPosition: 'bottom' | 'right';
    visible: boolean;
    position: { x: number; y: number };
    activeTab: string;
    isMinimized: boolean;
    isDetached: boolean;
    setIsDocked: (docked: boolean) => void;
    setDockedHeight: (height: number) => void;
    setDockedWidth: (width: number) => void;
    setDockPosition: (position: 'bottom' | 'right') => void;
    setVisible: (visible: boolean) => void;
    setPosition: (position: { x: number; y: number }) => void;
    setActiveTab: (tab: string) => void;
    setIsMinimized: (minimized: boolean) => void;
    setIsDetached: (detached: boolean) => void;
}

const AgentAssistantContext = createContext<AgentAssistantContextType | undefined>(undefined);

export const useAgentAssistant = (): AgentAssistantContextType => {
    const context = useContext(AgentAssistantContext);
    if (!context) {
        console.warn('useAgentAssistant: No AgentAssistantProvider found, using fallback values');
        return {
            isDocked: false,
            dockedHeight: 0,
            dockedWidth: 0,
            dockPosition: 'bottom',
            visible: false,
            position: { x: 400, y: 100 },
            activeTab: 'assistant',
            isMinimized: false,
            isDetached: false,
            setIsDocked: () => { },
            setDockedHeight: () => { },
            setDockedWidth: () => { },
            setDockPosition: () => { },
            setVisible: () => { },
            setPosition: () => { },
            setActiveTab: () => { },
            setIsMinimized: () => { },
            setIsDetached: () => { }
        };
    }
    return context;
};

export interface AgentAssistantProviderProps {
    children: React.ReactNode;
}

export const AgentAssistantProvider: React.FC<AgentAssistantProviderProps> = ({ children }) => {
    // Initialize from localStorage if available, otherwise use defaults
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

    const getInitialVisible = (): boolean => {
        if (typeof window === 'undefined') return false;
        const saved = localStorage.getItem('dadms-agent-visible');
        return saved ? JSON.parse(saved) : false;
    };

    const getInitialPosition = (): { x: number; y: number } => {
        if (typeof window === 'undefined') return { x: 400, y: 100 };
        const saved = localStorage.getItem('dadms-agent-position');
        return saved ? JSON.parse(saved) : { x: 400, y: 100 };
    };

    const getInitialActiveTab = (): string => {
        if (typeof window === 'undefined') return 'assistant';
        const saved = localStorage.getItem('dadms-agent-active-tab');
        return saved || 'assistant';
    };

    const getInitialMinimized = (): boolean => {
        if (typeof window === 'undefined') return false;
        const saved = localStorage.getItem('dadms-agent-minimized');
        return saved ? JSON.parse(saved) : false;
    };

    const getInitialDetached = (): boolean => {
        if (typeof window === 'undefined') return false;
        const saved = localStorage.getItem('dadms-agent-detached');
        return saved ? JSON.parse(saved) : false;
    };

    const getInitialDockPosition = (): 'bottom' | 'right' => {
        if (typeof window === 'undefined') return 'bottom';
        const saved = localStorage.getItem('dadms-agent-dock-position');
        return (saved as 'bottom' | 'right') || 'bottom';
    };

    const getInitialDockedWidth = (): number => {
        if (typeof window === 'undefined') return 320;
        const saved = localStorage.getItem('dadms-agent-docked-width');
        return saved ? parseInt(saved, 10) : 320;
    };

    const [isDocked, setIsDockedState] = useState(getInitialDockState);
    const [dockedHeight, setDockedHeightState] = useState(getInitialHeight);
    const [dockedWidth, setDockedWidthState] = useState(getInitialDockedWidth);
    const [dockPosition, setDockPositionState] = useState(getInitialDockPosition);
    const [visible, setVisibleState] = useState(getInitialVisible);
    const [position, setPositionState] = useState(getInitialPosition);
    const [activeTab, setActiveTabState] = useState(getInitialActiveTab);
    const [isMinimized, setIsMinimizedState] = useState(getInitialMinimized);
    const [isDetached, setIsDetachedState] = useState(getInitialDetached);
    const [mounted, setMounted] = useState(false);

    // Initialize from localStorage after mount to avoid hydration issues
    useEffect(() => {
        if (!mounted) {
            const initialDocked = getInitialDockState();
            const initialHeight = getInitialHeight();
            const initialVisible = getInitialVisible();
            const initialPosition = getInitialPosition();
            const initialActiveTab = getInitialActiveTab();
            const initialMinimized = getInitialMinimized();
            const initialDetached = getInitialDetached();
            const initialDockPosition = getInitialDockPosition();
            const initialDockedWidth = getInitialDockedWidth();

            setIsDockedState(initialDocked);
            setDockedHeightState(initialHeight);
            setVisibleState(initialVisible);
            setPositionState(initialPosition);
            setActiveTabState(initialActiveTab);
            setIsMinimizedState(initialMinimized);
            setIsDetachedState(initialDetached);
            setDockPositionState(initialDockPosition);
            setDockedWidthState(initialDockedWidth);
            setMounted(true);
        }
    }, [mounted]);

    // Persist to localStorage when state changes
    const setIsDocked = (docked: boolean) => {
        setIsDockedState(docked);
        if (typeof window !== 'undefined') {
            localStorage.setItem('dadms-agent-docked', JSON.stringify(docked));
        }
        // Reset docked dimensions when undocking
        if (!docked) {
            setDockedHeightState(0);
            setDockedWidthState(0);
            if (typeof window !== 'undefined') {
                localStorage.setItem('dadms-agent-height', '0');
                localStorage.setItem('dadms-agent-docked-width', '0');
            }
        }
    };

    const setDockedHeight = (height: number) => {
        setDockedHeightState(height);
        if (typeof window !== 'undefined') {
            localStorage.setItem('dadms-agent-height', height.toString());
        }
    };

    const setDockedWidth = (width: number) => {
        setDockedWidthState(width);
        if (typeof window !== 'undefined') {
            localStorage.setItem('dadms-agent-docked-width', width.toString());
        }
    };

    const setDockPosition = (position: 'bottom' | 'right') => {
        setDockPositionState(position);
        if (typeof window !== 'undefined') {
            localStorage.setItem('dadms-agent-dock-position', position);
        }
    };

    const setVisible = (visible: boolean) => {
        setVisibleState(visible);
        if (typeof window !== 'undefined') {
            localStorage.setItem('dadms-agent-visible', JSON.stringify(visible));
        }
    };

    const setPosition = (newPosition: { x: number; y: number }) => {
        setPositionState(newPosition);
        if (typeof window !== 'undefined') {
            localStorage.setItem('dadms-agent-position', JSON.stringify(newPosition));
        }
    };

    const setActiveTab = (tab: string) => {
        setActiveTabState(tab);
        if (typeof window !== 'undefined') {
            localStorage.setItem('dadms-agent-active-tab', tab);
        }
    };

    const setIsMinimized = (minimized: boolean) => {
        setIsMinimizedState(minimized);
        if (typeof window !== 'undefined') {
            localStorage.setItem('dadms-agent-minimized', JSON.stringify(minimized));
        }
    };

    const setIsDetached = (detached: boolean) => {
        setIsDetachedState(detached);
        if (typeof window !== 'undefined') {
            localStorage.setItem('dadms-agent-detached', JSON.stringify(detached));
        }
    };

    const value: AgentAssistantContextType = {
        isDocked,
        dockedHeight,
        dockedWidth,
        dockPosition,
        visible,
        position,
        activeTab,
        isMinimized,
        isDetached,
        setIsDocked,
        setDockedHeight,
        setDockedWidth,
        setDockPosition,
        setVisible,
        setPosition,
        setActiveTab,
        setIsMinimized,
        setIsDetached,
    };

    return (
        <AgentAssistantContext.Provider value={value}>
            {children}
        </AgentAssistantContext.Provider>
    );
}; 