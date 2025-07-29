'use client';

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import AASCar from "../components/AASCar";
import ProjectTreeView from "../components/ProjectTreeView";
import { TabBar as EnhancedTabBar } from "../components/shared/TabBar";
import { ThemeSelector } from "../components/shared/ThemeSelector";
import { AgentAssistantProvider } from "../contexts/AgentAssistantContext";
import { PanelStateProvider, usePanelState } from "../contexts/PanelStateContext";
import { TabProvider, useTabs } from "../contexts/TabContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import "./globals.css";

// Types for the grouped navigation structure
interface NavigationItem {
    id: string;
    icon: string;
    label: string;
    href?: string;
    view?: string;
    type: 'navigation' | 'view';
}

interface NavigationGroup {
    id: string;
    icon: string;
    label: string;
    items?: NavigationItem[];
    href?: string;
    type?: 'navigation';
}

// DADMS Activity Bar Items - Grouped structure with hover popouts
const dadmsActivityGroups: NavigationGroup[] = [
    {
        id: 'core',
        icon: 'home',
        label: 'Core',
        items: [
            {
                id: 'explorer',
                icon: 'files',
                label: 'Project Explorer',
                view: 'explorer',
                type: 'view'
            },
            {
                id: 'projects',
                icon: 'project',
                label: 'Projects',
                href: '/projects',
                type: 'navigation'
            },
            {
                id: 'knowledge',
                icon: 'library',
                label: 'Knowledge Base',
                href: '/knowledge',
                type: 'navigation'
            }
        ]
    },
    {
        id: 'workspaces',
        icon: 'layout',
        label: 'Workspaces',
        items: [
            {
                id: 'ontology',
                icon: 'type-hierarchy',
                label: 'Ontology Workspace',
                href: '/ontology',
                type: 'navigation'
            },
            {
                id: 'ontology-modeler',
                icon: 'edit',
                label: 'Ontology Modeler',
                href: '/ontology-modeler',
                type: 'navigation'
            },
            {
                id: 'bpmn',
                icon: 'git-branch',
                label: 'BPMN Workspace',
                href: '/bpmn',
                type: 'navigation'
            },
            {
                id: 'sysml',
                icon: 'symbol-class',
                label: 'SysML Workspace',
                href: '/sysml',
                type: 'navigation'
            }
        ]
    },
    {
        id: 'development-tools',
        icon: 'tools',
        label: 'Development Tools',
        items: [
            {
                id: 'jupyter-lab',
                icon: 'beaker',
                label: 'Jupyter Lab',
                href: '/jupyter-lab',
                type: 'navigation'
            }
        ]
    },
    {
        id: 'ai-services',
        icon: 'chat-sparkle',
        label: 'AI Services',
        items: [
            {
                id: 'llm',
                icon: 'beaker',
                label: 'LLM Playground',
                href: '/llm',
                type: 'navigation'
            },
            {
                id: 'context',
                icon: 'extensions',
                label: 'Context Manager',
                href: '/context',
                type: 'navigation'
            }
        ]
    },
    {
        id: 'process-managers',
        icon: 'gear',
        label: 'Process Managers',
        items: [
            {
                id: 'process',
                icon: 'git-branch',
                label: 'Process Manager',
                href: '/process',
                type: 'navigation'
            },
            {
                id: 'thread',
                icon: 'comment-discussion',
                label: 'Thread Manager',
                href: '/thread',
                type: 'navigation'
            },
            {
                id: 'task',
                icon: 'checklist',
                label: 'Task Orchestrator',
                href: '/task',
                type: 'navigation'
            }
        ]
    },
    {
        id: 'data-managers',
        icon: 'database',
        label: 'Data Managers',
        items: [
            {
                id: 'data',
                icon: 'server',
                label: 'Data Manager',
                href: '/data',
                type: 'navigation'
            },
            {
                id: 'analysis',
                icon: 'graph-line',
                label: 'Analysis Manager',
                href: '/analysis',
                type: 'navigation'
            },
            {
                id: 'decision',
                icon: 'pie-chart',
                label: 'Decision Analytics',
                href: '/decision',
                type: 'navigation'
            }
        ]
    },
    {
        id: 'model-managers',
        icon: 'package',
        label: 'Model Managers',
        items: [
            {
                id: 'model',
                icon: 'layers',
                label: 'Model Manager',
                href: '/model',
                type: 'navigation'
            },
            {
                id: 'simulation',
                icon: 'pulse',
                label: 'Simulation Manager',
                href: '/simulation',
                type: 'navigation'
            },
            {
                id: 'parameter',
                icon: 'settings',
                label: 'Parameter Manager',
                href: '/parameter',
                type: 'navigation'
            }
        ]
    },
    {
        id: 'system-services',
        icon: 'tools',
        label: 'System Services',
        items: [
            {
                id: 'memory',
                icon: 'archive',
                label: 'Memory Manager',
                href: '/memory',
                type: 'navigation'
            },
            {
                id: 'requirements',
                icon: 'list-tree',
                label: 'Requirements Extractor',
                href: '/requirements',
                type: 'navigation'
            },
            {
                id: 'event',
                icon: 'broadcast',
                label: 'Event Manager',
                href: '/event',
                type: 'navigation'
            },
            {
                id: 'error',
                icon: 'warning',
                label: 'Error Manager',
                href: '/error',
                type: 'navigation'
            },
            {
                id: 'agent-assistance',
                icon: 'hubot',
                label: 'Agent Assistance Service',
                href: '/agent-assistance',
                type: 'navigation'
            }
        ]
    },
    {
        id: 'assistant',
        icon: 'book',
        label: 'Agent Assistant & Documentation Service',
        href: '/aads',
        type: 'navigation'
    },
    {
        id: 'user-tasks',
        icon: 'tasklist',
        label: 'User Tasks',
        href: '/user-tasks',
        type: 'navigation'
    }
];

function ActivityBar({ activeView, onViewChange }: { activeView: string; onViewChange: (view: string) => void }) {
    const pathname = usePathname();
    const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
    const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
    const { navigateToTab } = useTabs();

    const handleItemClick = (item: NavigationItem) => {
        if (item.type === 'view') {
            onViewChange(item.view!);
        } else if (item.type === 'navigation' && item.href) {
            navigateToTab(item.href);
        }
    };

    const handleGroupClick = (group: NavigationGroup) => {
        if (group.items) {
            // For groups, just show the popout on hover
            return;
        } else {
            // For single items like AADS, navigate directly
            if (group.href) {
                navigateToTab(group.href);
            }
        }
    };

    const isGroupActive = (group: NavigationGroup) => {
        if (group.items) {
            return group.items.some((item: NavigationItem) =>
                item.type === 'view' ? activeView === item.view : pathname === item.href
            );
        } else {
            return pathname === group.href;
        }
    };

    const isItemActive = (item: NavigationItem) => {
        return item.type === 'view' ? activeView === item.view : pathname === item.href;
    };

    const handleMouseEnter = (groupId: string) => {
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            setHoverTimeout(null);
        }
        setHoveredGroup(groupId);
    };

    const handleMouseLeave = () => {
        const timeout = setTimeout(() => {
            setHoveredGroup(null);
        }, 300); // 300ms delay before hiding
        setHoverTimeout(timeout);
    };

    return (
        <div className="vscode-activitybar">
            {dadmsActivityGroups.map((group) => (
                <div
                    key={group.id}
                    className="activity-group"
                    onMouseEnter={() => handleMouseEnter(group.id)}
                    onMouseLeave={handleMouseLeave}
                >
                    <div
                        className={`vscode-activitybar-item ${isGroupActive(group) ? 'active' : ''}`}
                        onClick={() => handleGroupClick(group)}
                        title={group.label}
                    >
                        <i className={`codicon codicon-${group.icon}`}></i>
                    </div>

                    {/* Popout Menu */}
                    {group.items && hoveredGroup === group.id && (
                        <div className="activity-popout">
                            <div className="activity-popout-header">
                                {group.label}
                            </div>
                            <div className="activity-popout-items">
                                {group.items.map((item: any) => (
                                    <div
                                        key={item.id}
                                        className={`activity-popout-item ${isItemActive(item) ? 'active' : ''}`}
                                        onClick={() => handleItemClick(item)}
                                    >
                                        <i className={`codicon codicon-${item.icon}`}></i>
                                        <span>{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function ExplorerView({ isCollapsed, onToggleCollapse }: { isCollapsed: boolean; onToggleCollapse: () => void }) {
    return (
        <div className={`vscode-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="vscode-sidebar-header">
                <div className="sidebar-header-content">
                    <div
                        className="sidebar-header-left"
                        onClick={isCollapsed ? onToggleCollapse : undefined}
                        title={isCollapsed ? "Click to expand Project Explorer" : undefined}
                    >
                        <i className="codicon codicon-files sidebar-header-icon"></i>
                        <span>PROJECT EXPLORER</span>
                    </div>
                    <button
                        className="sidebar-collapse-button"
                        onClick={onToggleCollapse}
                        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        <i className={`codicon codicon-${isCollapsed ? 'chevron-right' : 'chevron-left'}`}></i>
                    </button>
                </div>
            </div>
            {!isCollapsed && (
                <div className="vscode-sidebar-content">
                    <ProjectTreeView />
                </div>
            )}
        </div>
    );
}

function SearchView({ isCollapsed, onToggleCollapse }: { isCollapsed: boolean; onToggleCollapse: () => void }) {
    return (
        <div className={`vscode-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="vscode-sidebar-header">
                <div className="sidebar-header-content">
                    <div
                        className="sidebar-header-left"
                        onClick={isCollapsed ? onToggleCollapse : undefined}
                        title={isCollapsed ? "Click to expand Search" : undefined}
                    >
                        <i className="codicon codicon-search sidebar-header-icon"></i>
                        <span>SEARCH</span>
                    </div>
                    <button
                        className="sidebar-collapse-button"
                        onClick={onToggleCollapse}
                        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        <i className={`codicon codicon-${isCollapsed ? 'chevron-right' : 'chevron-left'}`}></i>
                    </button>
                </div>
            </div>
            {!isCollapsed && (
                <div className="vscode-sidebar-content" style={{ padding: '16px' }}>
                    <div style={{ color: 'var(--vscode-sideBar-foreground)', fontSize: '13px' }}>
                        <p>Search functionality will be implemented in future versions.</p>
                        <p style={{ marginTop: '16px', color: 'var(--vscode-tab-inactiveForeground)' }}>
                            This will include:
                        </p>
                        <ul style={{ marginTop: '8px', paddingLeft: '16px', color: 'var(--vscode-tab-inactiveForeground)' }}>
                            <li>Global project search</li>
                            <li>Knowledge base search</li>
                            <li>Process search</li>
                            <li>Thread search</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}

function DefaultView({ viewType, isCollapsed, onToggleCollapse }: { viewType: string; isCollapsed: boolean; onToggleCollapse: () => void }) {
    const titles: Record<string, string> = {
        scm: 'SOURCE CONTROL',
        debug: 'RUN AND DEBUG',
        extensions: 'EXTENSIONS'
    };

    const getIconForView = (viewType: string): string => {
        const iconMap: Record<string, string> = {
            scm: 'source-control',
            debug: 'debug',
            extensions: 'extensions'
        };
        return iconMap[viewType] || 'view';
    };

    return (
        <div className={`vscode-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="vscode-sidebar-header">
                <div className="sidebar-header-content">
                    <div
                        className="sidebar-header-left"
                        onClick={isCollapsed ? onToggleCollapse : undefined}
                        title={isCollapsed ? `Click to expand ${titles[viewType] || 'View'}` : undefined}
                    >
                        <i className={`codicon codicon-${getIconForView(viewType)} sidebar-header-icon`}></i>
                        <span>{titles[viewType] || 'VIEW'}</span>
                    </div>
                    <button
                        className="sidebar-collapse-button"
                        onClick={onToggleCollapse}
                        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        <i className={`codicon codicon-${isCollapsed ? 'chevron-right' : 'chevron-left'}`}></i>
                    </button>
                </div>
            </div>
            {!isCollapsed && (
                <div className="vscode-sidebar-content" style={{ padding: '16px' }}>
                    <div style={{ color: 'var(--vscode-sideBar-foreground)', fontSize: '13px' }}>
                        <p>This view will be implemented in future versions of DADMS.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

function SidebarView({ activeView }: { activeView: string }) {
    const { getPanelState, togglePanelCollapsed } = usePanelState();
    const sidebarState = getPanelState('project-explorer');

    switch (activeView) {
        case 'explorer':
            return <ExplorerView isCollapsed={sidebarState.isCollapsed} onToggleCollapse={() => togglePanelCollapsed('project-explorer')} />;
        case 'search':
            return <SearchView isCollapsed={sidebarState.isCollapsed} onToggleCollapse={() => togglePanelCollapsed('project-explorer')} />;
        default:
            return <DefaultView viewType={activeView} isCollapsed={sidebarState.isCollapsed} onToggleCollapse={() => togglePanelCollapsed('project-explorer')} />;
    }
}

function TabBar() {
    return <EnhancedTabBar />;
}

function StatusBar({ showBottomPanel, onTogglePanel }: { showBottomPanel: boolean; onTogglePanel: () => void }) {
    return (
        <div className="vscode-statusbar">
            <div className="vscode-statusbar-left">
                <div className="vscode-statusbar-item">
                    <i className="codicon codicon-git-branch"></i>
                    <span>main</span>
                </div>
                <div className="vscode-statusbar-item">
                    <i className="codicon codicon-sync"></i>
                </div>
                <div className="vscode-statusbar-item">
                    <i className="codicon codicon-error"></i>
                    <span>0</span>
                </div>
                <div className="vscode-statusbar-item">
                    <i className="codicon codicon-warning"></i>
                    <span>0</span>
                </div>
            </div>
            <div className="vscode-statusbar-right">
                <div className="vscode-statusbar-item">
                    <ThemeSelector />
                </div>
                <div className="vscode-statusbar-item">
                    <span>DADMS 2.0</span>
                </div>
                <div className="vscode-statusbar-item">
                    <span>TypeScript React</span>
                </div>
                <div className="vscode-statusbar-item">
                    <i className="codicon codicon-bell-dot"></i>
                </div>
                <div className="vscode-statusbar-item">
                    <button
                        className="status-button"
                        onClick={onTogglePanel}
                        title="Toggle Agent Assistant Panel"
                    >
                        <i className="codicon codicon-hubot"></i>
                        Agent Assistant
                    </button>
                </div>
            </div>
        </div>
    );
}

// Main layout component
function MainLayout({ children }: { children: React.ReactNode }) {
    const { tabs, activeTabId, navigateToTab } = useTabs();
    const [activeView, setActiveView] = useState<string>('explorer');
    const [showBottomPanel, setShowBottomPanel] = useState(false);
    const [dockPosition, setDockPosition] = useState<'bottom' | 'right'>('bottom');
    const [isMinimized, setIsMinimized] = useState(false);

    const handleViewChange = (viewId: string) => {
        setActiveView(viewId);
    };

    const toggleDockPosition = () => {
        setDockPosition(prev => prev === 'bottom' ? 'right' : 'bottom');
    };

    const toggleMinimize = () => {
        setIsMinimized(prev => !prev);
    };

    return (
        <div className="vscode-layout">
            {/* Title Bar */}
            <div className="vscode-titlebar">
                <div className="title">DADMS 2.0 - Decision Analysis & Decision Management System</div>
                <div className="titlebar-actions">
                    <div
                        className="titlebar-action"
                        onClick={() => navigateToTab('/settings')}
                        title="Configuration & Settings"
                    >
                        <i className="codicon codicon-settings-gear"></i>
                    </div>
                </div>
            </div>

            {/* Main Layout */}
            <div className="vscode-main">
                {/* Activity Bar */}
                <ActivityBar activeView={activeView} onViewChange={handleViewChange} />

                {/* Sidebar */}
                <SidebarView activeView={activeView} />

                {/* Editor Area with Resizable Panels */}
                <div className="vscode-editor-area">
                    {/* Tab Bar */}
                    <TabBar />

                    {/* Resizable Panel Group */}
                    <PanelGroup direction={dockPosition === 'bottom' ? 'vertical' : 'horizontal'} style={{ height: '100%' }}>
                        {/* Main Content Panel */}
                        <Panel defaultSize={showBottomPanel ? (isMinimized ? 95 : 70) : 100} minSize={30}>
                            <div className="vscode-editor">
                                {children}
                            </div>
                        </Panel>

                        {/* Docked Panel (AAS) */}
                        {showBottomPanel && (
                            <>
                                <PanelResizeHandle className={dockPosition === 'bottom' ? 'panel-resize-handle-horizontal' : 'panel-resize-handle-vertical'} />
                                <Panel
                                    defaultSize={isMinimized ? 5 : 30}
                                    minSize={isMinimized ? 5 : 20}
                                    maxSize={isMinimized ? 5 : 50}
                                    collapsible={false}
                                >
                                    <div className="vscode-panel">
                                        <div className="panel-header">
                                            <div className="panel-title">Agent Assistant</div>
                                            <div className="panel-actions">
                                                <button
                                                    className="panel-action"
                                                    onClick={toggleMinimize}
                                                    title={isMinimized ? "Maximize" : "Minimize"}
                                                >
                                                    <i className={`codicon ${isMinimized ? 'codicon-chevron-up' : 'codicon-chevron-down'}`}></i>
                                                </button>
                                                <button
                                                    className="panel-action"
                                                    onClick={toggleDockPosition}
                                                    title={`Move to ${dockPosition === 'bottom' ? 'right' : 'bottom'}`}
                                                >
                                                    <i className={`codicon ${dockPosition === 'bottom' ? 'codicon-layout-sidebar-right' : 'codicon-layout-panel'}`}></i>
                                                </button>
                                                <button
                                                    className="panel-action"
                                                    onClick={() => setShowBottomPanel(false)}
                                                    title="Close Panel"
                                                >
                                                    <i className="codicon codicon-close"></i>
                                                </button>
                                            </div>
                                        </div>
                                        {!isMinimized && (
                                            <div className="panel-content">
                                                <AASCar />
                                            </div>
                                        )}
                                    </div>
                                </Panel>
                            </>
                        )}
                    </PanelGroup>
                </div>
            </div>

            {/* Status Bar */}
            <StatusBar showBottomPanel={showBottomPanel} onTogglePanel={() => setShowBottomPanel(!showBottomPanel)} />

            {/* Floating Action Button for AAS */}
            {!showBottomPanel && (
                <button
                    className="aas-floating-button"
                    onClick={() => setShowBottomPanel(true)}
                    title="Open Agent Assistant"
                >
                    <i className="codicon codicon-hubot"></i>
                </button>
            )}
        </div>
    );
}

// Root layout that only provides providers
export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <title>DADMS 2.0 - Decision Intelligence Platform</title>
                <meta name="description" content="Professional decision intelligence platform for engineering teams" />
            </head>
            <body>
                <ThemeProvider defaultTheme="dark">
                    <PanelStateProvider>
                        <TabProvider>
                            <AgentAssistantProvider>
                                <MainLayout>
                                    {children}
                                </MainLayout>
                            </AgentAssistantProvider>
                        </TabProvider>
                    </PanelStateProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}

