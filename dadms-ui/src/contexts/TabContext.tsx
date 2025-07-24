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

// Navigation configuration - this should match your actual navigation structure
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

export const TabProvider: React.FC<TabProviderProps> = ({ children }) => {
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [activeTabId, setActiveTabId] = useState<string | null>(null);
    const pathname = usePathname();
    const router = useRouter();
    const isInitialized = useRef(false);
    const isNavigating = useRef(false);

    // Get page info from navigation configuration
    const getPageInfo = useCallback((path: string) => {
        const config = NAVIGATION_CONFIG[path as keyof typeof NAVIGATION_CONFIG];
        if (config) {
            return { title: config.title, icon: config.icon };
        }
        return { title: 'Unknown Page', icon: 'file' };
    }, []);

    // Generate unique tab ID
    const generateTabId = useCallback(() => {
        return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    // Find or create tab for a path
    const findOrCreateTab = useCallback((path: string, title?: string, icon?: string) => {
        const existingTab = tabs.find(tab => tab.path === path);
        if (existingTab) {
            return existingTab;
        }

        const { title: pageTitle, icon: pageIcon } = getPageInfo(path);
        const tabTitle = title || pageTitle;
        const tabIcon = icon || pageIcon;

        const newTab: Tab = {
            id: generateTabId(),
            title: tabTitle,
            icon: tabIcon,
            path,
            isActive: true,
            isPinned: false,
            isModified: false,
            canClose: true
        };

        return newTab;
    }, [tabs, getPageInfo, generateTabId]);

    // Add a new tab
    const addTab = useCallback((path: string, title?: string, icon?: string) => {
        const newTab = findOrCreateTab(path, title, icon);

        setTabs(prevTabs => {
            // Check if tab already exists
            const existingTab = prevTabs.find(tab => tab.path === path);
            if (existingTab) {
                // Just activate the existing tab
                return prevTabs.map(tab => ({
                    ...tab,
                    isActive: tab.id === existingTab.id
                }));
            }

            // Deactivate all other tabs and add new one
            const updatedTabs = prevTabs.map(tab => ({ ...tab, isActive: false }));
            return [...updatedTabs, newTab];
        });

        setActiveTabId(newTab.id);
        return newTab.id;
    }, [findOrCreateTab]);

    // Navigate to a specific path (creates tab if needed)
    const navigateToTab = useCallback((path: string) => {
        isNavigating.current = true;
        const tabId = addTab(path);
        router.push(path);
        return tabId;
    }, [addTab, router]);

    // Switch to a specific tab
    const switchTab = useCallback((tabId: string) => {
        const tab = tabs.find(t => t.id === tabId);
        if (!tab) return;

        setTabs(prevTabs => {
            const updatedTabs = prevTabs.map(t => ({
                ...t,
                isActive: t.id === tabId
            }));
            return updatedTabs;
        });

        setActiveTabId(tabId);

        // Navigate to the tab's path if different from current pathname
        if (tab.path !== pathname) {
            isNavigating.current = true;
            router.push(tab.path);
        }
    }, [tabs, pathname, router]);

    // Close a tab
    const closeTab = useCallback((tabId: string) => {
        setTabs(prevTabs => {
            const tabToClose = prevTabs.find(tab => tab.id === tabId);
            if (!tabToClose) return prevTabs;

            const remainingTabs = prevTabs.filter(tab => tab.id !== tabId);

            // If we're closing the active tab, activate the next available tab
            if (tabToClose.isActive && remainingTabs.length > 0) {
                const nextTab = remainingTabs[remainingTabs.length - 1] || remainingTabs[0];
                remainingTabs.forEach(tab => {
                    tab.isActive = tab.id === nextTab.id;
                });
                setActiveTabId(nextTab.id);

                // Navigate to the next tab's path
                if (nextTab.path !== pathname) {
                    isNavigating.current = true;
                    router.push(nextTab.path);
                }
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
        setTabs([]);
        setActiveTabId(null);
        router.push('/');
    }, [router]);

    // Close other tabs
    const closeOtherTabs = useCallback((tabId: string) => {
        setTabs(prevTabs => {
            const tabToKeep = prevTabs.find(tab => tab.id === tabId);
            return tabToKeep ? [tabToKeep] : [];
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

    // Handle pathname changes - create or switch to tab
    useEffect(() => {
        if (!pathname || isNavigating.current) {
            isNavigating.current = false;
            return;
        }

        const existingTab = tabs.find(tab => tab.path === pathname);
        if (existingTab) {
            // Switch to existing tab
            setTabs(prevTabs => {
                const updatedTabs = prevTabs.map(tab => ({
                    ...tab,
                    isActive: tab.id === existingTab.id
                }));
                return updatedTabs;
            });
            setActiveTabId(existingTab.id);
        } else {
            // Create new tab for this path
            const { title: pageTitle, icon: pageIcon } = getPageInfo(pathname);
            const newTab: Tab = {
                id: generateTabId(),
                title: pageTitle,
                icon: pageIcon,
                path: pathname,
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
        }
    }, [pathname, getPageInfo, generateTabId]); // Remove tabs and addTab from dependencies

    // Initialize with current page if no tabs exist
    useEffect(() => {
        if (!isInitialized.current && pathname && tabs.length === 0) {
            isInitialized.current = true;
            const { title: pageTitle, icon: pageIcon } = getPageInfo(pathname);
            const newTab: Tab = {
                id: generateTabId(),
                title: pageTitle,
                icon: pageIcon,
                path: pathname,
                isActive: true,
                isPinned: false,
                isModified: false,
                canClose: true
            };

            setTabs([newTab]);
            setActiveTabId(newTab.id);
        }
    }, [pathname, tabs.length, getPageInfo, generateTabId]);

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