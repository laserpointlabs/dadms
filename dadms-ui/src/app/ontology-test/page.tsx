"use client";

import React from 'react';
import { OntologyWorkspace } from '../../components/OntologyWorkspace';

const OntologyTestPage: React.FC = () => {
    return (
        <div style={{
            width: '100%',
            height: '100%',
            margin: 0,
            padding: 0,
            overflow: 'hidden',
            background: 'var(--theme-bg-primary)'
        }}>
            <OntologyWorkspace
                workspaceId="test-workspace"
                projectId="test-project"
            />
        </div>
    );
};

export default OntologyTestPage; 