'use client';

import React, { useState } from 'react';
import { useTabs } from '../../contexts/TabContext';
import { Icon } from './Icon';

interface TabBarProps {
    className?: string;
}

export const TabBar: React.FC<TabBarProps> = ({ className = '' }) => {
    const { tabs, activeTabId, switchTab, closeTab, pinTab, unpinTab, closeAllTabs, closeOtherTabs, closeTabsToRight, navigateToTab } = useTabs();
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null);
    const [newTabMenu, setNewTabMenu] = useState<{ x: number; y: number } | null>(null);

    const handleTabClick = (tabId: string) => {
        switchTab(tabId);
    };

    const handleTabClose = (e: React.MouseEvent, tabId: string) => {
        e.stopPropagation();
        closeTab(tabId);
    };

    const handleTabContextMenu = (e: React.MouseEvent, tabId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, tabId });
    };

    const handleContextMenuAction = (action: string, tabId: string) => {
        switch (action) {
            case 'close':
                closeTab(tabId);
                break;
            case 'closeOthers':
                closeOtherTabs(tabId);
                break;
            case 'closeToRight':
                closeTabsToRight(tabId);
                break;
            case 'closeAll':
                closeAllTabs();
                break;
            case 'pin':
                pinTab(tabId);
                break;
            case 'unpin':
                unpinTab(tabId);
                break;
        }
        setContextMenu(null);
    };

    const closeContextMenu = () => {
        setContextMenu(null);
        setNewTabMenu(null);
    };

    const handleNewTabClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('New tab button clicked'); // Debug log

        // Calculate optimal position for the menu
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const menuWidth = 320; // Increased menu width for better spacing
        const menuHeight = 450; // Increased menu height for better spacing
        const padding = 40; // Increased padding from edge for better appearance

        let x = e.clientX;
        let y = e.clientY;

        // Ensure menu doesn't go off the right edge
        if (x + menuWidth > viewportWidth - padding) {
            x = viewportWidth - menuWidth - padding;
        }

        // Ensure menu doesn't go off the left edge
        if (x < padding) {
            x = padding;
        }

        // Ensure menu doesn't go off the bottom edge
        if (y + menuHeight > viewportHeight - padding) {
            y = e.clientY - menuHeight - 10; // Show above the click point
        }

        // Ensure menu doesn't go off the top edge
        if (y < padding) {
            y = padding;
        }

        setNewTabMenu({ x, y });
    };

    const handleNewTabAction = (path: string) => {
        navigateToTab(path);
        setNewTabMenu(null);
    };

    const handleQuickNewTab = () => {
        // Quick action: open the most commonly used page (Projects)
        navigateToTab('/projects');
    };

    // Common pages for new tab menu - organized by category
    const commonPages = [
        // Core Workspaces
        { path: '/projects', title: 'Projects', icon: 'project', category: 'Core' },
        { path: '/ontology', title: 'Ontology Workspace', icon: 'type-hierarchy', category: 'Core' },
        { path: '/ontology-modeler', title: 'Ontology Modeler', icon: 'edit', category: 'Core' },

        // AI Services
        { path: '/llm', title: 'LLM Playground', icon: 'beaker', category: 'AI' },
        { path: '/context', title: 'Context Manager', icon: 'extensions', category: 'AI' },

        // Data & Analysis
        { path: '/data', title: 'Data Manager', icon: 'server', category: 'Data' },
        { path: '/analysis', title: 'Analysis Manager', icon: 'graph-line', category: 'Data' },
        { path: '/decision', title: 'Decision Analytics', icon: 'pie-chart', category: 'Data' },

        // Process Management
        { path: '/process', title: 'Process Manager', icon: 'git-branch', category: 'Process' },
        { path: '/thread', title: 'Thread Manager', icon: 'comment-discussion', category: 'Process' },
        { path: '/task', title: 'Task Orchestrator', icon: 'checklist', category: 'Process' },

        // Model Management
        { path: '/model', title: 'Model Manager', icon: 'layers', category: 'Models' },
        { path: '/simulation', title: 'Simulation Manager', icon: 'pulse', category: 'Models' },

        // Home
        { path: '/', title: 'DADMS 2.0', icon: 'home', category: 'Home' },
    ];

    // Close context menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            // Don't close if clicking on the new tab button or menu
            const target = e.target as Element;
            if (target.closest('.vscode-tabs-new-tab') || target.closest('.vscode-context-menu')) {
                return;
            }
            closeContextMenu();
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Keyboard shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+T to open new tab menu
            if (e.ctrlKey && e.key === 't') {
                e.preventDefault();
                const newTabButton = document.querySelector('.vscode-tabs-new-tab') as HTMLElement;
                if (newTabButton) {
                    const rect = newTabButton.getBoundingClientRect();

                    // Calculate optimal position for the menu
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;
                    const menuWidth = 320; // Increased menu width for better spacing
                    const menuHeight = 450; // Increased menu height for better spacing
                    const padding = 40; // Increased padding from edge for better appearance

                    let x = rect.left;
                    let y = rect.bottom + 5;

                    // Ensure menu doesn't go off the right edge
                    if (x + menuWidth > viewportWidth - padding) {
                        x = viewportWidth - menuWidth - padding;
                    }

                    // Ensure menu doesn't go off the left edge
                    if (x < padding) {
                        x = padding;
                    }

                    // Ensure menu doesn't go off the bottom edge
                    if (y + menuHeight > viewportHeight - padding) {
                        y = rect.top - menuHeight - 5; // Show above the button
                    }

                    // Ensure menu doesn't go off the top edge
                    if (y < padding) {
                        y = padding;
                    }

                    setNewTabMenu({ x, y });
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (tabs.length === 0) {
        return (
            <div className={`vscode-tabs ${className}`}>
                <div className="vscode-tab-placeholder">
                    <span className="text-theme-text-muted">No tabs open</span>
                    <button
                        onClick={handleNewTabClick}
                        className="ml-2 px-2 py-1 text-xs bg-theme-accent-primary text-white rounded hover:bg-theme-accent-secondary"
                    >
                        New Tab
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={`vscode-tabs ${className}`}>
                <div className="vscode-tabs-container">
                    {tabs.map((tab) => (
                        <div
                            key={tab.id}
                            className={`vscode-tab ${tab.isActive ? 'active' : ''} ${tab.isPinned ? 'pinned' : ''} ${tab.isModified ? 'modified' : ''}`}
                            onClick={() => handleTabClick(tab.id)}
                            onContextMenu={(e) => handleTabContextMenu(e, tab.id)}
                            title={tab.title}
                        >
                            {/* Pin indicator */}
                            {tab.isPinned && (
                                <div className="vscode-tab-pin">
                                    <Icon name="pin" size="xs" />
                                </div>
                            )}

                            {/* Tab icon */}
                            <div className="vscode-tab-icon">
                                <Icon name={tab.icon as any} size="sm" />
                            </div>

                            {/* Tab label */}
                            <div className="vscode-tab-label">
                                {tab.title}
                                {tab.isModified && <span className="vscode-tab-modified-indicator">•</span>}
                            </div>

                            {/* Close button */}
                            {tab.canClose && tabs.length > 1 && (
                                <div
                                    className="vscode-tab-close"
                                    onClick={(e) => handleTabClose(e, tab.id)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    title="Close tab"
                                >
                                    <Icon name="close" size="xs" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* New Tab Button */}
                <button
                    className="vscode-tabs-new-tab"
                    onClick={handleNewTabClick}
                    title="New Tab (Click for menu, Shift+Click for quick Projects tab)"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (e.shiftKey) {
                                handleQuickNewTab();
                            } else {
                                handleNewTabClick(e as any);
                            }
                        }
                    }}
                    type="button"
                    aria-label="New Tab"
                >
                    <Icon name="plus" size="sm" />
                </button>

                {/* Tab overflow indicator */}
                {tabs.length > 8 && (
                    <div className="vscode-tabs-overflow">
                        <Icon name="more" size="sm" />
                    </div>
                )}
            </div>

            {/* New Tab Menu */}
            {newTabMenu && (
                <div
                    className="vscode-context-menu"
                    style={{
                        position: 'fixed',
                        top: newTabMenu.y,
                        left: newTabMenu.x,
                        zIndex: 1000,
                        minWidth: '320px',
                        maxWidth: '400px',
                        borderRadius: '8px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)',
                        border: '1px solid var(--theme-border-primary)',
                        backgroundColor: 'var(--theme-bg-primary)',
                        backdropFilter: 'blur(8px)'
                    }}
                >
                    <div className="vscode-context-menu-header" style={{
                        padding: '16px 20px 12px 20px',
                        borderBottom: '1px solid var(--theme-border-primary)',
                        backgroundColor: 'var(--theme-bg-secondary)',
                        borderTopLeftRadius: '8px',
                        borderTopRightRadius: '8px'
                    }}>
                        <span style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: 'var(--theme-text-primary)'
                        }}>
                            Open New Tab
                        </span>
                        <div style={{
                            fontSize: '12px',
                            color: 'var(--theme-text-secondary)',
                            marginTop: '4px',
                            lineHeight: '1.4'
                        }}>
                            Shift+Click + button for quick Projects tab
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="vscode-context-menu-separator"></div>
                    <div
                        className="vscode-context-menu-item vscode-context-menu-item-highlighted"
                        onClick={() => handleNewTabAction('/projects')}
                        style={{
                            backgroundColor: 'var(--theme-accent-primary)',
                            color: 'var(--theme-text-on-accent)',
                            margin: '8px 12px',
                            borderRadius: '6px',
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            border: '1px solid var(--theme-accent-secondary)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--theme-accent-secondary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--theme-accent-primary)';
                        }}
                    >
                        <Icon name="project" size="sm" />
                        <span style={{ fontWeight: '500' }}>Projects (Quick)</span>
                        <span style={{
                            fontSize: '11px',
                            opacity: '0.8',
                            marginLeft: 'auto',
                            padding: '2px 6px',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            borderRadius: '4px'
                        }}>
                            Most Common
                        </span>
                    </div>

                    <div className="vscode-context-menu-separator"></div>

                    {/* Categorized Pages */}
                    {['Core', 'AI', 'Data', 'Process', 'Models', 'Home'].map(category => {
                        const categoryPages = commonPages.filter(page => page.category === category);
                        if (categoryPages.length === 0) return null;

                        return (
                            <div key={category}>
                                <div className="vscode-context-menu-category" style={{
                                    padding: '8px 20px 4px 20px',
                                    backgroundColor: 'var(--theme-bg-secondary)'
                                }}>
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        color: 'var(--theme-text-secondary)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        opacity: '0.8'
                                    }}>
                                        {category}
                                    </span>
                                </div>
                                {categoryPages.map((page) => (
                                    <div
                                        key={page.path}
                                        className="vscode-context-menu-item"
                                        onClick={() => handleNewTabAction(page.path)}
                                    >
                                        <Icon name={page.icon as any} size="sm" />
                                        <span>{page.title}</span>
                                    </div>
                                ))}
                                {category !== 'Home' && <div className="vscode-context-menu-separator"></div>}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="vscode-context-menu"
                    style={{
                        position: 'fixed',
                        top: contextMenu.y,
                        left: contextMenu.x,
                        zIndex: 1000
                    }}
                >
                    <div className="vscode-context-menu-item" onClick={() => handleContextMenuAction('close', contextMenu.tabId)}>
                        <Icon name="close" size="sm" />
                        <span>Close</span>
                    </div>
                    <div className="vscode-context-menu-item" onClick={() => handleContextMenuAction('closeOthers', contextMenu.tabId)}>
                        <Icon name="close" size="sm" />
                        <span>Close Others</span>
                    </div>
                    <div className="vscode-context-menu-item" onClick={() => handleContextMenuAction('closeToRight', contextMenu.tabId)}>
                        <Icon name="close" size="sm" />
                        <span>Close to the Right</span>
                    </div>
                    <div className="vscode-context-menu-separator"></div>
                    <div
                        className={`vscode-context-menu-item ${tabs.length <= 1 ? 'vscode-context-menu-item-disabled' : ''}`}
                        onClick={() => tabs.length > 1 && handleContextMenuAction('closeAll', contextMenu.tabId)}
                        title={tabs.length <= 1 ? 'Cannot close all tabs - at least one tab must remain open' : 'Close all tabs'}
                    >
                        <Icon name="close" size="sm" />
                        <span>Close All</span>
                    </div>
                    <div className="vscode-context-menu-separator"></div>
                    {tabs.find(t => t.id === contextMenu.tabId)?.isPinned ? (
                        <div className="vscode-context-menu-item" onClick={() => handleContextMenuAction('unpin', contextMenu.tabId)}>
                            <Icon name="pin" size="sm" />
                            <span>Unpin</span>
                        </div>
                    ) : (
                        <div className="vscode-context-menu-item" onClick={() => handleContextMenuAction('pin', contextMenu.tabId)}>
                            <Icon name="pin" size="sm" />
                            <span>Pin</span>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}; 