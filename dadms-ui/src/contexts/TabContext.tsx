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
    '/user-tasks': { title: 'User Tasks', icon: 'files' },
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
    const lastPathname = useRef<string>('');
    const uniquePaths = useRef<Set<string>>(new Set()); // Track unique paths to prevent duplicates

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

                    // Update unique paths set
                    uniquePaths.current = new Set(updatedTabs.map(tab => tab.path));

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
            const { title, icon } = getPageInfo(pathname || '/');
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
            uniquePaths.current.add(pathname);
        }
        isInitialized.current = true;
    }, [loadFromStorage, pathname, getPageInfo, generateTabId]);

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

    // BULLETPROOF: Deduplication effect - removes any duplicate tabs immediately
    useEffect(() => {
        if (!isInitialized.current || tabs.length === 0) return;

        const pathCounts = new Map<string, string[]>();

        // Count tabs by path
        tabs.forEach(tab => {
            if (!pathCounts.has(tab.path)) {
                pathCounts.set(tab.path, []);
            }
            pathCounts.get(tab.path)!.push(tab.id);
        });

        // Find duplicates
        const duplicates = new Map<string, string[]>();
        pathCounts.forEach((tabIds, path) => {
            if (tabIds.length > 1) {
                duplicates.set(path, tabIds);
            }
        });

        // Remove duplicates, keeping only the first (most recent) tab for each path
        if (duplicates.size > 0) {
            console.warn('Duplicate tabs detected, cleaning up:', duplicates);

            setTabs(prevTabs => {
                const cleanedTabs: Tab[] = [];
                const processedPaths = new Set<string>();

                prevTabs.forEach(tab => {
                    if (!processedPaths.has(tab.path)) {
                        // Keep the first tab for this path
                        cleanedTabs.push(tab);
                        processedPaths.add(tab.path);
                    } else {
                        // Remove duplicate tab
                        console.log(`Removing duplicate tab: ${tab.title} (${tab.path})`);
                    }
                });

                return cleanedTabs;
            });
        }
    }, [tabs]);

    // Handle pathname changes - completely rewritten with bulletproof deduplication
    useEffect(() => {
        // Skip if not initialized, navigating programmatically, or no pathname
        if (!isInitialized.current || isNavigating.current || !pathname) {
            isNavigating.current = false;
            return;
        }

        // Skip if pathname hasn't actually changed
        if (pathname === lastPathname.current) {
            return;
        }

        lastPathname.current = pathname;

        // BULLETPROOF: Check if path already exists in our tracking set
        if (uniquePaths.current.has(pathname)) {
            // Path exists - just activate the existing tab
            const existingTab = tabs.find(tab => tab.path === pathname);
            if (existingTab && !existingTab.isActive) {
                setTabs(prevTabs =>
                    prevTabs.map(tab => ({
                        ...tab,
                        isActive: tab.id === existingTab.id
                    }))
                );
                setActiveTabId(existingTab.id);
            }
        } else {
            // Path doesn't exist - create new tab and track it
            const { title, icon } = getPageInfo(pathname || '/');
            const newTab: Tab = {
                id: generateTabId(),
                title,
                icon,
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
            uniquePaths.current.add(pathname); // Track this path
        }
    }, [pathname, tabs, getPageInfo, generateTabId]);

    // Add a new tab - simplified to prevent duplication
    const addTab = useCallback((path: string, title?: string, icon?: string) => {
        // BULLETPROOF: Check if path already exists in our tracking set
        if (uniquePaths.current.has(path)) {
            // Tab exists - just switch to it
            const existingTab = tabs.find(tab => tab.path === path);
            if (existingTab && !existingTab.isActive) {
                setTabs(prevTabs =>
                    prevTabs.map(tab => ({
                        ...tab,
                        isActive: tab.id === existingTab.id
                    }))
                );
                setActiveTabId(existingTab.id);
            }

            // Navigate to the tab's path if different from current pathname
            if (existingTab && existingTab.path !== pathname) {
                isNavigating.current = true;
                router.push(existingTab.path);
            }
            return existingTab?.id || '';
        }

        // Create new tab and track the path
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
        uniquePaths.current.add(path); // Track this path
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

            // Remove from unique paths tracking
            uniquePaths.current.delete(tabToClose.path);

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
        uniquePaths.current.clear();
        uniquePaths.current.add('/');
        router.push('/');
    }, [router, generateTabId]);

    // Close other tabs
    const closeOtherTabs = useCallback((tabId: string) => {
        setTabs(prevTabs => {
            const tabToKeep = prevTabs.find(tab => tab.id === tabId);
            if (!tabToKeep) return prevTabs;

            // Update unique paths tracking
            uniquePaths.current.clear();
            uniquePaths.current.add(tabToKeep.path);

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

            const remainingTabs = prevTabs.slice(0, tabIndex + 1);

            // Update unique paths tracking
            uniquePaths.current.clear();
            remainingTabs.forEach(tab => uniquePaths.current.add(tab.path));

            return remainingTabs;
        });
    }, []);

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