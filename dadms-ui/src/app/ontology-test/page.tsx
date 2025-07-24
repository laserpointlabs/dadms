"use client";

import OntologyWorkspace from '../../components/OntologyWorkspace/OntologyWorkspace';
import { PageLayout } from '../../components/shared/PageLayout';

export default function OntologyTestPage() {
    return (
        <PageLayout
            title="Ontology Modeler - Note Test"
            subtitle="Test the new React Flow note capability in the ontology modeler"
            icon="symbol-class"
            status={{ text: 'Note Feature Active', type: 'active' }}
        >
            <div style={{ height: 'calc(100vh - 120px)' }}>
                <OntologyWorkspace />
            </div>
        </PageLayout>
    );
} 