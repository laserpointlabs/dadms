import ThreadManager from '../../components/ThreadManager';
import { PageLayout } from '../../components/shared/PageLayout';

const ThreadPage = () => (
    <PageLayout
        title="Thread Manager"
        subtitle="Track and manage process execution threads with feedback and analysis"
        icon="type-hierarchy"
        status={{ text: 'Thread Tracking Active', type: 'active' }}
    >
        <div className="max-w-7xl mx-auto py-6 px-4">
            <div className="bg-theme-surface rounded-lg shadow-md p-6 mb-4">
                <ThreadManager />
            </div>
        </div>
    </PageLayout>
);

export default ThreadPage; 