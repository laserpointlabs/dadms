'use client';

import { CollapsiblePanel } from '../../components/shared/CollapsiblePanel';
import { PageLayout } from '../../components/shared/PageLayout';
import { usePanelState } from '../../contexts/PanelStateContext';

export default function TestPanelsPage() {
    const { resetPanelStates } = usePanelState();

    return (
        <PageLayout
            title="Panel State Test"
            subtitle="Test persistent collapsible panel states"
            icon="settings-gear"
        >
            <div style={{ padding: '20px', maxWidth: '800px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <h2>Test Persistent Panel States</h2>
                    <p>
                        This page demonstrates the persistent collapsible panel functionality.
                        Try collapsing and expanding panels, then refresh the page to see that
                        the states are preserved.
                    </p>
                    <button
                        onClick={resetPanelStates}
                        style={{
                            padding: '8px 16px',
                            background: 'var(--theme-accent-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginTop: '10px'
                        }}
                    >
                        Reset All Panel States
                    </button>
                </div>

                <CollapsiblePanel
                    panelId="test-panel-1"
                    title="Test Panel 1"
                    icon="folder"
                    defaultCollapsed={false}
                >
                    <p>This is the content of test panel 1. Try collapsing this panel and refreshing the page.</p>
                    <p>The state should be preserved across page refreshes.</p>
                </CollapsiblePanel>

                <CollapsiblePanel
                    panelId="test-panel-2"
                    title="Test Panel 2"
                    icon="file"
                    defaultCollapsed={true}
                >
                    <p>This is the content of test panel 2. This panel starts collapsed by default.</p>
                    <p>You can expand it and the state will be remembered.</p>
                </CollapsiblePanel>

                <CollapsiblePanel
                    panelId="test-panel-3"
                    title="Test Panel 3"
                    icon="settings-gear"
                    defaultCollapsed={false}
                >
                    <p>This is the content of test panel 3.</p>
                    <ul>
                        <li>Panel states are stored in localStorage</li>
                        <li>States persist across browser sessions</li>
                        <li>Each panel has a unique ID</li>
                        <li>States can be reset programmatically</li>
                    </ul>
                </CollapsiblePanel>

                <CollapsiblePanel
                    panelId="test-panel-4"
                    title="Test Panel 4 (No Toggle Button)"
                    icon="info"
                    defaultCollapsed={false}
                    showToggleButton={false}
                >
                    <p>This panel doesn't show the toggle button in the header.</p>
                    <p>You can still collapse it by clicking the chevron icon.</p>
                </CollapsiblePanel>

                <div style={{ marginTop: '30px', padding: '20px', background: 'var(--theme-bg-secondary)', borderRadius: '8px' }}>
                    <h3>How it works:</h3>
                    <ol>
                        <li>Each panel has a unique <code>panelId</code></li>
                        <li>Panel states are managed by the <code>PanelStateContext</code></li>
                        <li>States are automatically saved to localStorage</li>
                        <li>States are restored when the page loads</li>
                        <li>You can reset all states using the button above</li>
                    </ol>
                </div>
            </div>
        </PageLayout>
    );
} 