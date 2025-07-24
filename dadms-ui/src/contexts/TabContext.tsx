'use client';

import { usePathname, useRouter } from 'next/navigation';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

export interface Tab {
    id: string;
    title: string;
    icon: string;
    path: string;
    isActive: boolean;
    isPinned: boolean;
    isModified: boolean;
    canClose: boolean;
}

interface TabContextType {
    tabs: Tab[];
    activeTabId: string | null;
    addTab: (path: string, title?: string, icon?: string) => string;
    closeTab: (tabId: string) => void;
    switchTab: (tabId: string) => void;
    pinTab: (tabId: string) => void;
    unpinTab: (tabId: string) => void;
    setTabModified: (tabId: string, modified: boolean) => void;
    closeAllTabs: () => void;
    closeOtherTabs: (tabId: string) => void;
    closeTabsToRight: (tabId: string) => void;
    navigateToTab: (path: string) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export const useTabs = () => {
    const context = useContext(TabContext);
    if (!context) {
        throw new Error('useTabs must be used within a TabProvider');
    }
    return context;
};

interface TabProviderProps {
    children: ReactNode;
}

// Navigation configuration
const NAVIGATION_CONFIG = {
    '/': { title: 'DADMS 2.0', icon: 'home' },
    '/projects': { title: 'Projects', icon: 'project' },
    '/knowledge': { title: 'Knowledge Base', icon: 'library' },
    '/ontology': { title: 'Ontology Workspace', icon: 'type-hierarchy' },
    '/ontology-modeler': { title: 'Ontology Modeler', icon: 'edit' },
    '/bpmn': { title: 'BPMN Workspace', icon: 'git-branch' },
    '/sysml': { title: 'SysML Workspace', icon: 'symbol-class' },
    '/llm': { title: 'LLM Playground', icon: 'beaker' },
    '/context': { title: 'Context Manager', icon: 'extensions' },
    '/process': { title: 'Process Manager', icon: 'git-branch' },
    '/thread': { title: 'Thread Manager', icon: 'comment-discussion' },
    '/task': { title: 'Task Orchestrator', icon: 'checklist' },
    '/data': { title: 'Data Manager', icon: 'server' },
    '/analysis': { title: 'Analysis Manager', icon: 'graph-line' },
    '/decision': { title: 'Decision Analytics', icon: 'pie-chart' },
    '/model': { title: 'Model Manager', icon: 'layers' },
    '/simulation': { title: 'Simulation Manager', icon: 'pulse' },
    '/parameter': { title: 'Parameter Manager', icon: 'settings' },
    '/memory': { title: 'Memory Manager', icon: 'archive' },
    '/requirements': { title: 'Requirements Extractor', icon: 'list-tree' },
    '/event': { title: 'Event Manager', icon: 'broadcast' },
    '/error': { title: 'Error Manager', icon: 'warning' },
    '/agent-assistance': { title: 'Agent Assistance Service', icon: 'hubot' },
    '/aads': { title: 'Agent Assistant & Documentation Service', icon: 'book' },
    '/test-tabs': { title: 'Test Tabs Page', icon: 'beaker' },
};

// localStorage keys
const STORAGE_KEYS = {
    TABS: 'dadms-tabs',
    ACTIVE_TAB: 'dadms-active-tab-id'
} as const;

export const TabProvider: React.FC<TabProviderProps> = ({ children }) => {
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [activeTabId, setActiveTabId] = useState<string | null>(null);
    const pathname = usePathname();
    const router = useRouter();

    // Refs for managing state
    const isInitialized = useRef(false);
    const isNavigating = useRef(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout>();

    // Get page info from navigation configuration
    const getPageInfo = useCallback((path: string) => {
        const config = NAVIGATION_CONFIG[path as keyof typeof NAVIGATION_CONFIG];
        if (config) {
            return { title: config.title, icon: config.icon };
        }
        return { title: 'Unknown Page', icon: 'file' };
    }, []);

    // Generate unique tab ID
    const generateTabId = useCallback((): string => {
        return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    // Debounced save to localStorage
    const saveToStorage = useCallback((newTabs: Tab[], newActiveTabId: string | null) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            try {
                localStorage.setItem(STORAGE_KEYS.TABS, JSON.stringify(newTabs));
                if (newActiveTabId) {
                    localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, newActiveTabId);
                }
            } catch (error) {
                console.warn('Failed to save tabs to localStorage:', error);
            }
        }, 100);
    }, []);

    // Load tabs from localStorage
    const loadFromStorage = useCallback(() => {
        try {
            const savedTabs = localStorage.getItem(STORAGE_KEYS.TABS);
            const savedActiveTabId = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);

            if (savedTabs) {
                const parsedTabs: Tab[] = JSON.parse(savedTabs);

                // Validate and clean the loaded tabs
                const validTabs = parsedTabs.filter(tab =>
                    tab.id &&
                    tab.title &&
                    tab.path &&
                    typeof tab.isActive === 'boolean'
                );

                if (validTabs.length > 0) {
                    // Ensure only one tab is active
                    const activeTabId = savedActiveTabId && validTabs.find(t => t.id === savedActiveTabId)
                        ? savedActiveTabId
                        : validTabs[0].id;

                    const updatedTabs = validTabs.map(tab => ({
                        ...tab,
                        isActive: tab.id === activeTabId
                    }));

                    setTabs(updatedTabs);
                    setActiveTabId(activeTabId);
                    return true; // Successfully loaded
                }
            }
        } catch (error) {
            console.warn('Failed to load tabs from localStorage:', error);
        }
        return false; // No valid tabs loaded
    }, []);

    // Initialize tabs on mount - only run once
    useEffect(() => {
        if (isInitialized.current) return;

        const loaded = loadFromStorage();
        if (!loaded && pathname) {
            // Create initial tab for current path
            const { title, icon } = getPageInfo(pathname);
            const initialTab: Tab = {
                id: generateTabId(),
                title,
                icon,
                path: pathname,
                isActive: true,
                isPinned: false,
                isModified: false,
                canClose: false // Initial tab cannot be closed
            };
            setTabs([initialTab]);
            setActiveTabId(initialTab.id);
        }
        isInitialized.current = true;
    }, []); // Empty dependency array - only run once

    // Save tabs to localStorage when they change
    useEffect(() => {
        if (isInitialized.current && tabs.length > 0) {
            saveToStorage(tabs, activeTabId);
        }
    }, [tabs, activeTabId, saveToStorage]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    // Add a new tab
    const addTab = useCallback((path: string, title?: string, icon?: string) => {
        // Check if tab already exists for this path
        const existingTab = tabs.find(tab => tab.path === path);
        if (existingTab) {
            // If tab exists and is already active, do nothing
            if (existingTab.isActive) {
                return existingTab.id;
            }

            // Switch to existing tab
            setTabs(prevTabs =>
                prevTabs.map(tab => ({
                    ...tab,
                    isActive: tab.id === existingTab.id
                }))
            );
            setActiveTabId(existingTab.id);

            // Navigate to the tab's path if different from current pathname
            if (existingTab.path !== pathname) {
                isNavigating.current = true;
                router.push(existingTab.path);
            }
            return existingTab.id;
        }

        const { title: pageTitle, icon: pageIcon } = getPageInfo(path);
        const newTab: Tab = {
            id: generateTabId(),
            title: title || pageTitle,
            icon: icon || pageIcon,
            path,
            isActive: true,
            isPinned: false,
            isModified: false,
            canClose: true
        };

        setTabs(prevTabs => {
            const updatedTabs = prevTabs.map(tab => ({ ...tab, isActive: false }));
            return [...updatedTabs, newTab];
        });

        setActiveTabId(newTab.id);
        return newTab.id;
    }, [tabs, getPageInfo, generateTabId, pathname, router]);

    // Switch to a specific tab
    const switchTab = useCallback((tabId: string) => {
        const tab = tabs.find(t => t.id === tabId);
        if (!tab) return;

        setTabs(prevTabs =>
            prevTabs.map(t => ({
                ...t,
                isActive: t.id === tabId
            }))
        );

        setActiveTabId(tabId);

        // Navigate to the tab's path if different from current pathname
        if (tab.path !== pathname) {
            isNavigating.current = true;
            router.push(tab.path);
        }
    }, [tabs, pathname, router]);

    // Navigate to a specific path (creates tab if needed)
    const navigateToTab = useCallback((path: string) => {
        isNavigating.current = true;
        const tabId = addTab(path);
        router.push(path);
        return tabId;
    }, [addTab, router]);

    // Close a tab
    const closeTab = useCallback((tabId: string) => {
        setTabs(prevTabs => {
            const tabToClose = prevTabs.find(tab => tab.id === tabId);
            if (!tabToClose || !tabToClose.canClose) return prevTabs;

            // Prevent closing the last tab
            if (prevTabs.length <= 1) {
                return prevTabs;
            }

            const remainingTabs = prevTabs.filter(tab => tab.id !== tabId);

            // If we're closing the active tab, activate the next available tab
            if (tabToClose.isActive && remainingTabs.length > 0) {
                const nextTab = remainingTabs[remainingTabs.length - 1] || remainingTabs[0];
                const updatedTabs = remainingTabs.map(tab => ({
                    ...tab,
                    isActive: tab.id === nextTab.id
                }));

                setActiveTabId(nextTab.id);

                // Navigate to the next tab's path
                if (nextTab.path !== pathname) {
                    isNavigating.current = true;
                    router.push(nextTab.path);
                }

                return updatedTabs;
            }

            return remainingTabs;
        });
    }, [pathname, router]);

    // Pin a tab
    const pinTab = useCallback((tabId: string) => {
        setTabs(prevTabs =>
            prevTabs.map(tab =>
                tab.id === tabId ? { ...tab, isPinned: true } : tab
            )
        );
    }, []);

    // Unpin a tab
    const unpinTab = useCallback((tabId: string) => {
        setTabs(prevTabs =>
            prevTabs.map(tab =>
                tab.id === tabId ? { ...tab, isPinned: false } : tab
            )
        );
    }, []);

    // Set tab modified state
    const setTabModified = useCallback((tabId: string, modified: boolean) => {
        setTabs(prevTabs =>
            prevTabs.map(tab =>
                tab.id === tabId ? { ...tab, isModified: modified } : tab
            )
        );
    }, []);

    // Close all tabs
    const closeAllTabs = useCallback(() => {
        const homeTab: Tab = {
            id: generateTabId(),
            title: 'DADMS 2.0',
            icon: 'home',
            path: '/',
            isActive: true,
            isPinned: false,
            isModified: false,
            canClose: false
        };

        setTabs([homeTab]);
        setActiveTabId(homeTab.id);
        router.push('/');
    }, [router, generateTabId]);

    // Close other tabs
    const closeOtherTabs = useCallback((tabId: string) => {
        setTabs(prevTabs => {
            const tabToKeep = prevTabs.find(tab => tab.id === tabId);
            if (!tabToKeep) return prevTabs;

            return [{
                ...tabToKeep,
                isActive: true
            }];
        });
        setActiveTabId(tabId);
    }, []);

    // Close tabs to the right
    const closeTabsToRight = useCallback((tabId: string) => {
        setTabs(prevTabs => {
            const tabIndex = prevTabs.findIndex(tab => tab.id === tabId);
            if (tabIndex === -1) return prevTabs;

            return prevTabs.slice(0, tabIndex + 1);
        });
    }, []);

    // Handle pathname changes - only run after initialization
    useEffect(() => {
        if (!isInitialized.current || !pathname || isNavigating.current) {
            isNavigating.current = false;
            return;
        }

        const existingTab = tabs.find(tab => tab.path === pathname);
        if (existingTab) {
            // If tab exists but is not active, activate it
            if (!existingTab.isActive) {
                setTabs(prevTabs =>
                    prevTabs.map(t => ({
                        ...t,
                        isActive: t.id === existingTab.id
                    }))
                );
                setActiveTabId(existingTab.id);
            }
        } else {
            // Create new tab for this path only if it doesn't exist
            addTab(pathname);
        }
    }, [pathname, addTab]); // Removed 'tabs' from dependencies to prevent infinite loops

    const value: TabContextType = {
        tabs,
        activeTabId,
        addTab,
        closeTab,
        switchTab,
        pinTab,
        unpinTab,
        setTabModified,
        closeAllTabs,
        closeOtherTabs,
        closeTabsToRight,
        navigateToTab
    };

    return (
        <TabContext.Provider value={value}>
            {children}
        </TabContext.Provider>
    );
}; 