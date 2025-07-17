'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import AASCar from "../components/AASCar";
import "./globals.css";

// Activity Bar Items (main navigation)
const activityBarItems = [
    { id: 'explorer', icon: 'files', label: 'Explorer', view: 'explorer' },
    { id: 'search', icon: 'search', label: 'Search', view: 'search' },
    { id: 'scm', icon: 'source-control', label: 'Source Control', view: 'scm' },
    { id: 'debug', icon: 'debug-alt', label: 'Run and Debug', view: 'debug' },
    { id: 'extensions', icon: 'extensions', label: 'Extensions', view: 'extensions' },
];

// DADMS Navigation Items for Explorer view
const dadmsPages = [
    {
        name: 'Projects',
        href: '/projects',
        icon: 'project',
        description: 'Manage decision projects',
        type: 'folder'
    },
    {
        name: 'Knowledge Base',
        href: '/knowledge',
        icon: 'library',
        description: 'Document & search knowledge',
        type: 'folder'
    },
    {
        name: 'LLM Playground',
        href: '/llm',
        icon: 'robot',
        description: 'AI model testing & experimentation',
        type: 'file'
    },
    {
        name: 'Context Manager',
        href: '/context',
        icon: 'settings-gear',
        description: 'Manage prompts, personas & tools',
        type: 'file'
    },
    {
        name: 'BPMN Workspace',
        href: '/bpmn',
        icon: 'graph',
        description: 'Design decision workflows',
        type: 'file'
    },
    {
        name: 'Process Manager',
        href: '/process',
        icon: 'pulse',
        description: 'Monitor workflow execution',
        type: 'file'
    },
    {
        name: 'Thread Manager',
        href: '/thread',
        icon: 'list-tree',
        description: 'Trace decision threads',
        type: 'file'
    },
    {
        name: 'Decision Assistant',
        href: '/aads',
        icon: 'star-full',
        description: 'Finalize decisions',
        type: 'file'
    },
];

function ActivityBar({ activeView, onViewChange }: { activeView: string; onViewChange: (view: string) => void }) {
    return (
        <div className="vscode-activitybar">
            {activityBarItems.map((item) => (
                <div
                    key={item.id}
                    className={`vscode-activitybar-item ${activeView === item.view ? 'active' : ''}`}
                    onClick={() => onViewChange(item.view)}
                    title={item.label}
                >
                    <i className={`codicon codicon-${item.icon}`}></i>
                </div>
            ))}
        </div>
    );
}

function ExplorerView() {
    const pathname = usePathname();

    return (
        <div className="vscode-sidebar">
            <div className="vscode-sidebar-header">
                DADMS EXPLORER
            </div>
            <div className="vscode-sidebar-content">
                {dadmsPages.map((page) => (
                    <Link
                        key={page.href}
                        href={page.href}
                        className={`vscode-sidebar-item ${pathname === page.href ? 'active' : ''}`}
                        title={page.description}
                    >
                        <i className={`codicon codicon-${page.icon}`}></i>
                        <span>{page.name}</span>
                    </Link>
                ))}
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
        const page = dadmsPages.find(p => p.href === path);
        return page ? page.name : 'DADMS 2.0';
    };

    const getPageIcon = (path: string | null): string => {
        if (!path) return 'home';
        const page = dadmsPages.find(p => p.href === path);
        return page ? page.icon : 'home';
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
