'use client';

import dynamic from 'next/dynamic';

// Dynamically import the editor to avoid SSR issues with Monaco
const VSCodeEditor = dynamic(() => import('../components/VSCodeEditor'), {
    ssr: false,
    loading: () => (
        <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#1e1e1e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#cccccc',
            fontSize: '14px'
        }}>
            Loading Monaco Editor...
        </div>
    )
});

const welcomeCode = `// Welcome to DADMS 2.0
// Decision Analysis & Decision Management System
// Professional decision intelligence platform for engineering teams

interface DADMSConfig {
    version: string;
    mode: 'development' | 'production';
    services: ServiceConfig[];
    ui: UIConfig;
}

interface ServiceConfig {
    name: string;
    port: number;
    status: 'active' | 'inactive' | 'pending';
    description: string;
}

interface UIConfig {
    theme: 'vscode-dark' | 'vscode-light';
    features: string[];
}

const dadmsConfig: DADMSConfig = {
    version: "2.0.0-alpha.2",
    mode: "development",
    services: [
        {
            name: "Project Service",
            port: 3001,
            status: "active",
            description: "User & project management"
        },
        {
            name: "LLM Service", 
            port: 3002,
            status: "active",
            description: "Multi-provider LLM integration"
        },
        {
            name: "Knowledge Service",
            port: 3003,
            status: "active", 
            description: "Document upload & RAG search"
        },
        {
            name: "Event Bus Service",
            port: 3004,
            status: "pending",
            description: "Real-time event communication"
        },
        {
            name: "Agent Assistance Service",
            port: 3005,
            status: "pending",
            description: "Intelligent proactive assistance"
        }
    ],
    ui: {
        theme: "vscode-dark",
        features: [
            "Activity Bar Navigation",
            "Explorer Sidebar", 
            "Tabbed Interface",
            "Monaco Editor Integration",
            "Status Bar",
            "Command Palette (Future)",
            "Settings (Future)"
        ]
    }
};

// Initialize DADMS 2.0
console.log("🚀 DADMS 2.0 - Engineering Preview");
console.log(\`📊 Version: \${dadmsConfig.version}\`);
console.log(\`🏗️  Mode: \${dadmsConfig.mode}\`);
console.log(\`⚡ Services: \${dadmsConfig.services.length} configured\`);

// Navigate through the application using the Activity Bar and Explorer
// Visit different pages to see the integrated decision intelligence platform

export default dadmsConfig;
`;

export default function HomePage() {
    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <VSCodeEditor
                value={welcomeCode}
                language="typescript"
                readOnly={false}
            />
        </div>
    );
}
