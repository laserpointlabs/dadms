'use client';

import { Icon } from '../components/shared/Icon';

interface SystemStatus {
    name: string;
    status: 'active' | 'inactive' | 'pending' | 'error';
    port: number;
    description: string;
    lastUpdate: string;
}

interface RecentFile {
    name: string;
    path: string;
    type: 'project' | 'document' | 'model' | 'workflow';
    lastModified: string;
    size: string;
}

interface SystemUpdate {
    version: string;
    date: string;
    title: string;
    description: string;
    type: 'feature' | 'bugfix' | 'security' | 'performance';
}

const systemServices: SystemStatus[] = [
    {
        name: "Project Service",
        status: "active",
        port: 3001,
        description: "User & project management",
        lastUpdate: "2 minutes ago"
    },
    {
        name: "LLM Service",
        status: "active",
        port: 3002,
        description: "Multi-provider LLM integration",
        lastUpdate: "1 minute ago"
    },
    {
        name: "Knowledge Service",
        status: "active",
        port: 3003,
        description: "Document upload & RAG search",
        lastUpdate: "30 seconds ago"
    },
    {
        name: "Event Manager",
        status: "active",
        port: 3004,
        description: "Real-time event communication",
        lastUpdate: "1 minute ago"
    },
    {
        name: "Agent Assistant",
        status: "pending",
        port: 3005,
        description: "Intelligent proactive assistance",
        lastUpdate: "Starting..."
    },
    {
        name: "LLM Playground",
        status: "active",
        port: 3006,
        description: "Interactive LLM testing",
        lastUpdate: "2 minutes ago"
    }
];

const recentFiles: RecentFile[] = [
    {
        name: "Project Alpha",
        path: "/projects/alpha",
        type: "project",
        lastModified: "2 hours ago",
        size: "2.3 MB"
    },
    {
        name: "System Requirements",
        path: "/knowledge/requirements.pdf",
        type: "document",
        lastModified: "1 day ago",
        size: "1.1 MB"
    },
    {
        name: "Decision Model v2",
        path: "/models/decision-v2",
        type: "model",
        lastModified: "3 days ago",
        size: "5.7 MB"
    },
    {
        name: "Workflow Process",
        path: "/bpmn/main-process",
        type: "workflow",
        lastModified: "1 week ago",
        size: "892 KB"
    }
];

const systemUpdates: SystemUpdate[] = [
    {
        version: "2.0.0-alpha.4",
        date: "2024-01-15",
        title: "Enhanced Tab Management",
        description: "Improved tab system with better state management and navigation",
        type: "feature"
    },
    {
        version: "2.0.0-alpha.3",
        date: "2024-01-10",
        title: "Monaco Editor Integration",
        description: "Added Monaco Editor for enhanced code editing experience",
        type: "feature"
    },
    {
        version: "2.0.0-alpha.2",
        date: "2024-01-05",
        title: "VSCode UI Framework",
        description: "Implemented VSCode-style interface with activity bar and sidebar",
        type: "feature"
    }
];

const getStatusColor = (status: SystemStatus['status']) => {
    switch (status) {
        case 'active': return 'text-green-500';
        case 'inactive': return 'text-gray-500';
        case 'pending': return 'text-yellow-500';
        case 'error': return 'text-red-500';
        default: return 'text-gray-500';
    }
};

const getStatusIcon = (status: SystemStatus['status']) => {
    switch (status) {
        case 'active': return 'check-circle';
        case 'inactive': return 'circle';
        case 'pending': return 'clock';
        case 'error': return 'error';
        default: return 'circle';
    }
};

const getTypeIcon = (type: RecentFile['type']) => {
    switch (type) {
        case 'project': return 'project';
        case 'document': return 'file';
        case 'model': return 'layers';
        case 'workflow': return 'git-branch';
        default: return 'file';
    }
};

const getUpdateTypeColor = (type: SystemUpdate['type']) => {
    switch (type) {
        case 'feature': return 'text-blue-500';
        case 'bugfix': return 'text-green-500';
        case 'security': return 'text-red-500';
        case 'performance': return 'text-purple-500';
        default: return 'text-gray-500';
    }
};

export default function HomePage() {
    return (
        <div className="dadms-dashboard" style={{
            padding: '24px',
            height: '100%',
            overflow: 'auto',
            backgroundColor: 'var(--theme-bg-primary)',
            color: 'var(--theme-text-primary)'
        }}>
            {/* Header */}
            <div style={{
                marginBottom: '32px',
                borderBottom: '1px solid var(--theme-border-primary)',
                paddingBottom: '16px'
            }}>
                <h1 style={{
                    fontSize: '28px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: 'var(--theme-text-primary)'
                }}>
                    DADMS 2.0 Dashboard
                </h1>
                <p style={{
                    fontSize: '16px',
                    color: 'var(--theme-text-secondary)',
                    margin: 0
                }}>
                    Decision Analysis & Decision Management System - Engineering Preview
                </p>
            </div>

            {/* Main Content Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24px',
                height: 'calc(100% - 120px)'
            }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* System Status */}
                    <div style={{
                        backgroundColor: 'var(--theme-bg-secondary)',
                        borderRadius: '8px',
                        padding: '20px',
                        border: '1px solid var(--theme-border-primary)'
                    }}>
                        <h2 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            marginBottom: '16px',
                            color: 'var(--theme-text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <Icon name="server" size="sm" />
                            System Status
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {systemServices.map((service, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px',
                                    backgroundColor: 'var(--theme-bg-primary)',
                                    borderRadius: '6px',
                                    border: '1px solid var(--theme-border-primary)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Icon
                                            name={getStatusIcon(service.status)}
                                            size="sm"
                                            className={getStatusColor(service.status)}
                                        />
                                        <div>
                                            <div style={{
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                color: 'var(--theme-text-primary)'
                                            }}>
                                                {service.name}
                                            </div>
                                            <div style={{
                                                fontSize: '12px',
                                                color: 'var(--theme-text-secondary)'
                                            }}>
                                                Port {service.port} • {service.description}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: '11px',
                                        color: 'var(--theme-text-secondary)'
                                    }}>
                                        {service.lastUpdate}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Files */}
                    <div style={{
                        backgroundColor: 'var(--theme-bg-secondary)',
                        borderRadius: '8px',
                        padding: '20px',
                        border: '1px solid var(--theme-border-primary)',
                        flex: 1
                    }}>
                        <h2 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            marginBottom: '16px',
                            color: 'var(--theme-text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <Icon name="files" size="sm" />
                            Recent Files
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {recentFiles.map((file, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px',
                                    backgroundColor: 'var(--theme-bg-primary)',
                                    borderRadius: '6px',
                                    border: '1px solid var(--theme-border-primary)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'var(--theme-bg-tertiary)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'var(--theme-bg-primary)';
                                    }}>
                                    <Icon name={getTypeIcon(file.type)} size="sm" />
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: 'var(--theme-text-primary)'
                                        }}>
                                            {file.name}
                                        </div>
                                        <div style={{
                                            fontSize: '12px',
                                            color: 'var(--theme-text-secondary)'
                                        }}>
                                            {file.path}
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: '11px',
                                        color: 'var(--theme-text-secondary)',
                                        textAlign: 'right'
                                    }}>
                                        <div>{file.lastModified}</div>
                                        <div>{file.size}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* System Updates */}
                    <div style={{
                        backgroundColor: 'var(--theme-bg-secondary)',
                        borderRadius: '8px',
                        padding: '20px',
                        border: '1px solid var(--theme-border-primary)',
                        flex: 1
                    }}>
                        <h2 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            marginBottom: '16px',
                            color: 'var(--theme-text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <Icon name="sync" size="sm" />
                            Recent Updates
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {systemUpdates.map((update, index) => (
                                <div key={index} style={{
                                    padding: '16px',
                                    backgroundColor: 'var(--theme-bg-primary)',
                                    borderRadius: '6px',
                                    border: '1px solid var(--theme-border-primary)'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: '8px'
                                    }}>
                                        <div style={{
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: 'var(--theme-text-primary)'
                                        }}>
                                            {update.title}
                                        </div>
                                        <span className={getUpdateTypeColor(update.type)} style={{
                                            fontSize: '11px',
                                            fontWeight: '500',
                                            textTransform: 'uppercase',
                                            padding: '2px 6px',
                                            backgroundColor: 'var(--theme-bg-secondary)',
                                            borderRadius: '4px'
                                        }}>
                                            {update.type}
                                        </span>
                                    </div>
                                    <div style={{
                                        fontSize: '13px',
                                        color: 'var(--theme-text-secondary)',
                                        marginBottom: '8px',
                                        lineHeight: '1.4'
                                    }}>
                                        {update.description}
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '11px',
                                        color: 'var(--theme-text-secondary)'
                                    }}>
                                        <Icon name="tag" size="xs" />
                                        v{update.version} • {update.date}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div style={{
                        backgroundColor: 'var(--theme-bg-secondary)',
                        borderRadius: '8px',
                        padding: '20px',
                        border: '1px solid var(--theme-border-primary)'
                    }}>
                        <h2 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            marginBottom: '16px',
                            color: 'var(--theme-text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <Icon name="rocket" size="sm" />
                            Quick Actions
                        </h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '12px'
                        }}>
                            {[
                                { name: 'New Project', icon: 'project', path: '/projects' },
                                { name: 'Upload Document', icon: 'upload', path: '/knowledge' },
                                { name: 'LLM Playground', icon: 'beaker', path: '/llm' },
                                { name: 'Create Workflow', icon: 'git-branch', path: '/bpmn' }
                            ].map((action, index) => (
                                <button
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '12px',
                                        backgroundColor: 'var(--theme-bg-primary)',
                                        border: '1px solid var(--theme-border-primary)',
                                        borderRadius: '6px',
                                        color: 'var(--theme-text-primary)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontSize: '13px',
                                        fontWeight: '500'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'var(--theme-accent-primary)';
                                        e.currentTarget.style.color = 'var(--theme-text-on-accent)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'var(--theme-bg-primary)';
                                        e.currentTarget.style.color = 'var(--theme-text-primary)';
                                    }}>
                                    <Icon name={action.icon as any} size="sm" />
                                    {action.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
