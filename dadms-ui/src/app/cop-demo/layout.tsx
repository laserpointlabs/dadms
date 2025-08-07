import React from 'react';

export const metadata = {
    title: 'Blue Force COP Demo | DADMS',
    description: 'Common Operating Picture demonstration with AI-driven semantic interoperability',
};

export default function COPDemoLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="cop-demo-layout">
            {children}
        </div>
    );
}
