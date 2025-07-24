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
        setNewTabMenu({ x: e.clientX, y: e.clientY });
    };

    const handleNewTabAction = (path: string) => {
        navigateToTab(path);
        setNewTabMenu(null);
    };

    // Common pages for new tab menu
    const commonPages = [
        { path: '/', title: 'DADMS 2.0', icon: 'home' },
        { path: '/projects', title: 'Projects', icon: 'project' },
        { path: '/ontology', title: 'Ontology Workspace', icon: 'type-hierarchy' },
        { path: '/llm', title: 'LLM Playground', icon: 'beaker' },
        { path: '/data', title: 'Data Manager', icon: 'server' },
        { path: '/analysis', title: 'Analysis Manager', icon: 'graph-line' },
        { path: '/test-tabs', title: 'Test Tabs Page', icon: 'beaker' },
    ];

    // Close context menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = () => closeContextMenu();
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
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
                            {tab.canClose && (
                                <div
                                    className="vscode-tab-close"
                                    onClick={(e) => handleTabClose(e, tab.id)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    <Icon name="close" size="xs" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* New Tab Button */}
                <div
                    className="vscode-tabs-new-tab"
                    onClick={handleNewTabClick}
                    title="New Tab"
                >
                    <Icon name="plus" size="sm" />
                </div>

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
                        zIndex: 1000
                    }}
                >
                    <div className="vscode-context-menu-header">
                        <span>Open New Tab</span>
                    </div>
                    {commonPages.map((page) => (
                        <div
                            key={page.path}
                            className="vscode-context-menu-item"
                            onClick={() => handleNewTabAction(page.path)}
                        >
                            <Icon name={page.icon as any} size="sm" />
                            <span>{page.title}</span>
                        </div>
                    ))}
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
                    <div className="vscode-context-menu-item" onClick={() => handleContextMenuAction('closeAll', contextMenu.tabId)}>
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