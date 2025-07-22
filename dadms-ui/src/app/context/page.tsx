"use client";

import ContextManager from '../../components/ContextManager/ContextManager';
import { PageLayout } from '../../components/shared/PageLayout';

export default function ContextManagerPage() {
    return (
        <PageLayout
            title="Context Manager"
            subtitle="Manage AI personas, teams, tools, and prompt templates"
            icon="settings-gear"
            status={{ text: 'Context System Active', type: 'active' }}
        >
            <ContextManager />
        </PageLayout>
    );
} 