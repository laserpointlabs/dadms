"use client";

import SysMLWorkspace from '../../components/SysMLWorkspace/SysMLWorkspace';
import { PageLayout } from '../../components/shared/PageLayout';

export default function SysMLWorkspacePage() {
    return (
        <PageLayout
            title="SysML Workspace"
            subtitle="Create and manage SysML v2 models with block definition and internal block diagrams"
            icon="symbol-class"
            status={{ text: 'SysML v2 Modeler Active', type: 'active' }}
        >
            <SysMLWorkspace />
        </PageLayout>
    );
} 