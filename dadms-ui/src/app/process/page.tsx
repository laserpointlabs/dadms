import ProcessManager from '../../components/ProcessManager';
import { PageLayout } from '../../components/shared/PageLayout';

const ProcessPage = () => (
    <PageLayout
        title="Process Manager"
        subtitle="Manage BPMN processes and workflow executions"
        icon="graph"
        status={{ text: 'Process Engine Active', type: 'active' }}
    >
        <div className="max-w-7xl mx-auto py-6 px-4">
            <div className="bg-theme-surface rounded-lg shadow-md p-6 mb-4">
                <ProcessManager />
            </div>
        </div>
    </PageLayout>
);

export default ProcessPage; 