'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Types
interface PanelState {
    isCollapsed: boolean;
    isOpen: boolean;
}

interface PanelStates {
    [panelId: string]: PanelState;
}

interface PanelStateContextType {
    getPanelState: (panelId: string) => PanelState;
    setPanelCollapsed: (panelId: string, isCollapsed: boolean) => void;
    setPanelOpen: (panelId: string, isOpen: boolean) => void;
    togglePanelCollapsed: (panelId: string) => void;
    togglePanelOpen: (panelId: string) => void;
    resetPanelStates: () => void;
}

// Constants
const STORAGE_KEY = 'dadms-panel-states';

// Default panel states
const DEFAULT_PANEL_STATES: PanelStates = {
    // Project Explorer panels
    'project-explorer': { isCollapsed: false, isOpen: true },
    'project-tree': { isCollapsed: false, isOpen: true },

    // Ontology Workspace panels
    'ontology-explorer': { isCollapsed: false, isOpen: true },
    'ontology-palette': { isCollapsed: false, isOpen: true },
    'ontology-properties': { isCollapsed: false, isOpen: true },
    'ontology-references': { isCollapsed: false, isOpen: true },

    // Relationship selector groups
    'relationship-custom': { isCollapsed: true, isOpen: true },
    'relationship-decision': { isCollapsed: false, isOpen: true },
    'relationship-organizational': { isCollapsed: true, isOpen: true },
    'relationship-basic': { isCollapsed: true, isOpen: true },
};

// Create context with default value
const PanelStateContext = createContext<PanelStateContextType | undefined>(undefined);

// Internal hook for individual panel state management
const createPanelHook = (panelId: string, context: PanelStateContextType) => {
    const state = context.getPanelState(panelId);

    return useMemo(() => ({
        isCollapsed: state.isCollapsed,
        isOpen: state.isOpen,
        setCollapsed: (collapsed: boolean) => context.setPanelCollapsed(panelId, collapsed),
        setOpen: (open: boolean) => context.setPanelOpen(panelId, open),
        toggleCollapsed: () => context.togglePanelCollapsed(panelId),
        toggleOpen: () => context.togglePanelOpen(panelId),
    }), [panelId, state.isCollapsed, state.isOpen, context]);
};

// Provider component with performance optimizations
export const PanelStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [panelStates, setPanelStates] = useState<PanelStates>(DEFAULT_PANEL_STATES);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load panel states from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsedStates = JSON.parse(stored);
                setPanelStates({ ...DEFAULT_PANEL_STATES, ...parsedStates });
            }
            setIsInitialized(true);
        } catch (error) {
            console.warn('Failed to load panel states from localStorage:', error);
            setIsInitialized(true);
        }
    }, []);

    // Save panel states to localStorage whenever they change
    useEffect(() => {
        if (isInitialized) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(panelStates));
            } catch (error) {
                console.warn('Failed to save panel states to localStorage:', error);
            }
        }
    }, [panelStates, isInitialized]);

    // Memoized functions to prevent unnecessary re-renders
    const getPanelState = useCallback((panelId: string): PanelState => {
        return panelStates[panelId] || { isCollapsed: false, isOpen: true };
    }, [panelStates]);

    const setPanelCollapsed = useCallback((panelId: string, isCollapsed: boolean) => {
        setPanelStates(prev => ({
            ...prev,
            [panelId]: {
                ...getPanelState(panelId),
                isCollapsed
            }
        }));
    }, [getPanelState]);

    const setPanelOpen = useCallback((panelId: string, isOpen: boolean) => {
        setPanelStates(prev => ({
            ...prev,
            [panelId]: {
                ...getPanelState(panelId),
                isOpen
            }
        }));
    }, [getPanelState]);

    const togglePanelCollapsed = useCallback((panelId: string) => {
        const currentState = getPanelState(panelId);
        setPanelCollapsed(panelId, !currentState.isCollapsed);
    }, [getPanelState, setPanelCollapsed]);

    const togglePanelOpen = useCallback((panelId: string) => {
        const currentState = getPanelState(panelId);
        setPanelOpen(panelId, !currentState.isOpen);
    }, [getPanelState, setPanelOpen]);

    const resetPanelStates = useCallback(() => {
        setPanelStates(DEFAULT_PANEL_STATES);
    }, []);

    // Memoized context value to prevent unnecessary re-renders
    const contextValue = useMemo<PanelStateContextType>(() => ({
        getPanelState,
        setPanelCollapsed,
        setPanelOpen,
        togglePanelCollapsed,
        togglePanelOpen,
        resetPanelStates,
    }), [
        getPanelState,
        setPanelCollapsed,
        setPanelOpen,
        togglePanelCollapsed,
        togglePanelOpen,
        resetPanelStates,
    ]);

    return (
        <PanelStateContext.Provider value={contextValue}>
            {children}
        </PanelStateContext.Provider>
    );
};

// Hook to access the panel state context
export const usePanelState = (): PanelStateContextType => {
    const context = useContext(PanelStateContext);
    if (context === undefined) {
        throw new Error('usePanelState must be used within a PanelStateProvider');
    }
    return context;
};

// Hook for individual panel state management (exported for convenience)
export const usePanel = (panelId: string) => {
    const context = usePanelState();
    return createPanelHook(panelId, context);
}; 