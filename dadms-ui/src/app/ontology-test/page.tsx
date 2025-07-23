"use client";

import React from 'react';
import { OntologyWorkspace } from '../../components/OntologyWorkspace';
import { PageLayout } from '../../components/shared/PageLayout';

const OntologyTestPage: React.FC = () => {
    return (
        <PageLayout
            title="Ontology Workspace"
            subtitle="Design and manage decision intelligence ontologies with AI-enhanced modeling"
            icon="type-hierarchy"
            status={{
                text: 'Workspace Ready',
                type: 'active'
            }}
        >
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
        </PageLayout>
    );
};

export default OntologyTestPage; 