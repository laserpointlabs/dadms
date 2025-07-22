'use client';

import { usePathname } from "next/navigation";
import { useState } from "react";
import AASCar from "../components/AASCar";
import ProjectTreeView from "../components/ProjectTreeView";
import "./globals.css";

// DADMS Activity Bar Items (replaces generic VS Code icons with DADMS functionality)
const dadmsActivityItems = [
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
    },
    {
        id: 'explorer',
        icon: 'files',
        label: 'Project Explorer',
        view: 'explorer',
        type: 'view'
    },
    {
        id: 'ontology',
        icon: 'type-hierarchy',
        label: 'Ontology Builder',
        href: '/ontology',
        type: 'navigation'
    },
    {
        id: 'llm',
        icon: 'robot',
        label: 'LLM Playground',
        href: '/llm',
        type: 'navigation'
    },
    {
        id: 'context',
        icon: 'settings-gear',
        label: 'Context Manager',
        href: '/context',
        type: 'navigation'
    },
    {
        id: 'bpmn',
        icon: 'graph',
        label: 'BPMN Workspace',
        href: '/bpmn',
        type: 'navigation'
    },
    {
        id: 'process',
        icon: 'pulse',
        label: 'Process Manager',
        href: '/process',
        type: 'navigation'
    },
    {
        id: 'thread',
        icon: 'list-tree',
        label: 'Thread Manager',
        href: '/thread',
        type: 'navigation'
    },
    {
        id: 'aads',
        icon: 'star-full',
        label: 'Decision Assistant',
        href: '/aads',
        type: 'navigation'
    },
];

function ActivityBar({ activeView, onViewChange }: { activeView: string; onViewChange: (view: string) => void }) {
    const pathname = usePathname();

    const handleItemClick = (item: typeof dadmsActivityItems[0]) => {
        if (item.type === 'view') {
            onViewChange(item.view!);
        } else if (item.type === 'navigation' && item.href) {
            // For navigation items, we'll use Next.js navigation
            window.location.href = item.href;
        }
    };

    return (
        <div className="vscode-activitybar">
            {dadmsActivityItems.map((item) => {
                const isActive = item.type === 'view'
                    ? activeView === item.view
                    : pathname === item.href;

                return (
                    <div
                        key={item.id}
                        className={`vscode-activitybar-item ${isActive ? 'active' : ''}`}
                        onClick={() => handleItemClick(item)}
                        title={item.label}
                    >
                        <i className={`codicon codicon-${item.icon}`}></i>
                    </div>
                );
            })}
        </div>
    );
}

function ExplorerView() {
    return (
        <div className="vscode-sidebar">
            <div className="vscode-sidebar-header">
                PROJECT EXPLORER
            </div>
            <div className="vscode-sidebar-content">
                <ProjectTreeView />
            </div>
        </div>
    );
}

function SearchView() {
    return (
        <div className="vscode-sidebar">
            <div className="vscode-sidebar-header">
                SEARCH
            </div>
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
        </div>
    );
}

function DefaultView({ viewType }: { viewType: string }) {
    const titles: Record<string, string> = {
        scm: 'SOURCE CONTROL',
        debug: 'RUN AND DEBUG',
        extensions: 'EXTENSIONS'
    };

    return (
        <div className="vscode-sidebar">
            <div className="vscode-sidebar-header">
                {titles[viewType] || 'VIEW'}
            </div>
            <div className="vscode-sidebar-content" style={{ padding: '16px' }}>
                <div style={{ color: 'var(--vscode-sideBar-foreground)', fontSize: '13px' }}>
                    <p>This view will be implemented in future versions of DADMS.</p>
                </div>
            </div>
        </div>
    );
}

function SidebarView({ activeView }: { activeView: string }) {
    switch (activeView) {
        case 'explorer':
            return <ExplorerView />;
        case 'search':
            return <SearchView />;
        default:
            return <DefaultView viewType={activeView} />;
    }
}

function TabBar() {
    const pathname = usePathname();

    const getPageTitle = (path: string | null): string => {
        if (!path) return 'DADMS 2.0';
        const item = dadmsActivityItems.find(i => i.href === path);
        return item ? item.label : 'DADMS 2.0';
    };

    const getPageIcon = (path: string | null): string => {
        if (!path) return 'home';
        const item = dadmsActivityItems.find(i => i.href === path);
        return item ? item.icon : 'home';
    };

    return (
        <div className="vscode-tabs">
            <div className="vscode-tab active">
                <i className={`codicon codicon-${getPageIcon(pathname)}`} style={{ marginRight: '8px', fontSize: '16px' }}></i>
                <div className="vscode-tab-label">{getPageTitle(pathname)}</div>
                <div className="vscode-tab-close">
                    <i className="codicon codicon-close"></i>
                </div>
            </div>
        </div>
    );
}

function StatusBar() {
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
                    <span>DADMS 2.0</span>
                </div>
                <div className="vscode-statusbar-item">
                    <span>TypeScript React</span>
                </div>
                <div className="vscode-statusbar-item">
                    <i className="codicon codicon-bell-dot"></i>
                </div>
            </div>
        </div>
    );
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const [activeView, setActiveView] = useState('explorer');

    return (
        <html lang="en">
            <head>
                <title>DADMS 2.0 - Decision Analysis & Decision Management System</title>
                <meta name="description" content="Professional decision intelligence platform for engineering teams" />
            </head>
            <body>
                <div className="vscode-workbench">
                    {/* Title Bar */}
                    <div className="vscode-titlebar">
                        <div className="title">DADMS 2.0 - Decision Analysis & Decision Management System</div>
                    </div>

                    {/* Main Layout */}
                    <div className="vscode-main">
                        {/* Activity Bar */}
                        <ActivityBar activeView={activeView} onViewChange={setActiveView} />

                        {/* Sidebar */}
                        <SidebarView activeView={activeView} />

                        {/* Editor Area */}
                        <div className="vscode-editor-area">
                            {/* Tab Bar */}
                            <TabBar />

                            {/* Main Content */}
                            <div className="vscode-editor">
                                {children}
                            </div>
                        </div>
                    </div>

                    {/* Status Bar */}
                    <StatusBar />
                </div>

                {/* Agent Assistance Component */}
                <AASCar />
            </body>
        </html>
    );
}
