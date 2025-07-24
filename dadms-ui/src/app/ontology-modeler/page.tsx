"use client";

import React from 'react';
import { OntologyWorkspace } from '../../components/OntologyWorkspace';
import { Button } from '../../components/shared/Button';
import { PageLayout } from '../../components/shared/PageLayout';

const OntologyModelerPage: React.FC = () => {
    return (
        <PageLayout
            title="Ontology Modeler"
            subtitle="Design and manage decision intelligence ontologies with AI-enhanced modeling"
            icon="type-hierarchy"
            status={{
                text: 'Modeler Ready',
                type: 'active'
            }}
            actions={
                <Button
                    variant="secondary"
                    leftIcon="arrow-left"
                    onClick={() => window.location.href = '/ontology'}
                >
                    Back to Workspace
                </Button>
            }
        >
            <div style={{
                width: '100%',
                height: '100%',
                margin: 0,
                padding: 0,
                overflow: 'hidden',
                background: 'var(--theme-bg-primary)'
            }}>
                <OntologyWorkspace />
            </div>
        </PageLayout>
    );
};

export default OntologyModelerPage; 