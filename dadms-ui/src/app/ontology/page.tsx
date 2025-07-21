'use client';

import {
    Add as AddIcon,
    AutoAwesome as AutoAwesomeIcon,
    CheckCircle as CheckCircleIcon,
    Close as CloseIcon,
    DataObject as DataObjectIcon,
    Folder as FolderIcon,
    History as HistoryIcon,
    Refresh as RefreshIcon,
    Search as SearchIcon,
    Settings as SettingsIcon,
    TrendingUp as TrendingUpIcon,
    ViewList as ViewListIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { useEffect, useState } from 'react';

// Types based on our API specification
interface Ontology {
    id: string;
    name: string;
    description: string;
    version: string;
    domain: string;
    scope: 'general' | 'domain' | 'project';
    entities: Entity[];
    relationships: Relationship[];
    metadata: OntologyMetadata;
    created_at: string;
    updated_at: string;
}

interface Entity {
    id: string;
    name: string;
    type: 'concept' | 'individual' | 'property';
    confidence: number;
}

interface Relationship {
    id: string;
    name: string;
    type: 'hasA' | 'isA' | 'partOf' | 'relatedTo';
    confidence: number;
}

interface OntologyMetadata {
    extraction_job?: string;
    quality_score: number;
    completeness: number;
    consistency: number;
}

interface ExtractionJob {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
    progress: number;
    created_at: string;
}

export default function OntologyBuilder() {
    const [ontologies, setOntologies] = useState<Ontology[]>([]);
    const [extractionJobs, setExtractionJobs] = useState<ExtractionJob[]>([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Tabs configuration
    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: 'viewList' },
        { id: 'ontologies', label: 'Ontologies', icon: 'dataObject' },
        { id: 'extractions', label: 'Extractions', icon: 'autoAwesome' },
        { id: 'questions', label: 'Questions', icon: 'search' },
        { id: 'settings', label: 'Settings', icon: 'settings' }
    ];

    const getTabIcon = (iconName: string, className?: string) => {
        const props = { className: `text-sm ${className || ''}` };
        switch (iconName) {
            case 'viewList': return <ViewListIcon {...props} />;
            case 'dataObject': return <DataObjectIcon {...props} />;
            case 'autoAwesome': return <AutoAwesomeIcon {...props} />;
            case 'search': return <SearchIcon {...props} />;
            case 'settings': return <SettingsIcon {...props} />;
            default: return <ViewListIcon {...props} />;
        }
    };

    // Mock data for development
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Simulate API call with mock data
                setTimeout(() => {
                    setOntologies([
                        {
                            id: '1',
                            name: 'Aerospace Systems',
                            description: 'Comprehensive ontology for aerospace domain',
                            version: '1.2.0',
                            domain: 'aerospace',
                            scope: 'domain',
                            entities: [],
                            relationships: [],
                            metadata: {
                                quality_score: 0.92,
                                completeness: 0.88,
                                consistency: 0.94
                            },
                            created_at: '2025-01-10T10:00:00Z',
                            updated_at: '2025-01-15T14:30:00Z'
                        },
                        {
                            id: '2',
                            name: 'Project Alpha Concepts',
                            description: 'Project-specific ontology for Alpha initiative',
                            version: '0.3.0',
                            domain: 'aerospace',
                            scope: 'project',
                            entities: [],
                            relationships: [],
                            metadata: {
                                quality_score: 0.76,
                                completeness: 0.65,
                                consistency: 0.82
                            },
                            created_at: '2025-01-12T09:15:00Z',
                            updated_at: '2025-01-15T11:45:00Z'
                        }
                    ]);

                    setExtractionJobs([
                        {
                            id: '1',
                            name: 'Aerospace Documentation Analysis',
                            status: 'completed',
                            progress: 100,
                            created_at: '2025-01-15T08:00:00Z'
                        },
                        {
                            id: '2',
                            name: 'Requirements Extraction - Project Beta',
                            status: 'running',
                            progress: 65,
                            created_at: '2025-01-15T12:30:00Z'
                        },
                        {
                            id: '3',
                            name: 'Legacy System Ontology Migration',
                            status: 'pending',
                            progress: 0,
                            created_at: '2025-01-15T14:00:00Z'
                        }
                    ]);

                    setLoading(false);
                }, 1000);
            } catch (err) {
                setError('Failed to load ontology data');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleRefresh = () => {
        setLoading(true);
        // Simulate refresh
        setTimeout(() => setLoading(false), 800);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircleIcon className="text-green-600" />;
            case 'running': return <TrendingUpIcon className="text-blue-600" />;
            case 'failed': return <CloseIcon className="text-red-600" />;
            case 'pending': return <HistoryIcon className="text-yellow-600" />;
            default: return <HistoryIcon className="text-gray-600" />;
        }
    };

    const getScopeColor = (scope: string) => {
        switch (scope) {
            case 'general': return 'text-purple-600 bg-purple-100';
            case 'domain': return 'text-blue-600 bg-blue-100';
            case 'project': return 'text-green-600 bg-green-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <WarningIcon className="text-red-600 mr-2" />
                        <span className="text-red-800">{error}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Ontology Builder</h1>
                        <p className="text-gray-600 mt-1">Extract, manage, and integrate domain ontologies using AI</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleRefresh}
                            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Refresh data"
                        >
                            <RefreshIcon className="text-gray-600" />
                        </button>
                        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <AddIcon className="mr-2" />
                            New Extraction
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white border-b border-gray-200 px-6">
                <div className="flex space-x-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center py-4 px-1 border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {getTabIcon(tab.icon, 'mr-2')}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                {activeTab === 'dashboard' && (
                    <div className="p-6 space-y-6">
                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <div className="flex items-center">
                                    <FolderIcon className="text-blue-600 mr-3" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Ontologies</p>
                                        <p className="text-2xl font-bold text-gray-900">{ontologies.length}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <div className="flex items-center">
                                    <TrendingUpIcon className="text-green-600 mr-3" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Active Extractions</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {extractionJobs.filter(job => job.status === 'running').length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <div className="flex items-center">
                                    <CheckCircleIcon className="text-blue-600 mr-3" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Completed Jobs</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {extractionJobs.filter(job => job.status === 'completed').length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <div className="flex items-center">
                                    <DataObjectIcon className="text-purple-600 mr-3" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Avg Quality Score</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {ontologies.length > 0
                                                ? (ontologies.reduce((sum, ont) => sum + ont.metadata.quality_score, 0) / ontologies.length * 100).toFixed(0) + '%'
                                                : '0%'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Ontologies */}
                        <div className="bg-white rounded-lg border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">Recent Ontologies</h3>
                            </div>
                            <div className="divide-y divide-gray-200">
                                {ontologies.slice(0, 5).map((ontology) => (
                                    <div key={ontology.id} className="px-6 py-4 hover:bg-gray-50 cursor-pointer">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center">
                                                    <h4 className="text-sm font-medium text-gray-900">{ontology.name}</h4>
                                                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getScopeColor(ontology.scope)}`}>
                                                        {ontology.scope}
                                                    </span>
                                                    <span className="ml-2 text-xs text-gray-500">v{ontology.version}</span>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">{ontology.description}</p>
                                                <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                                                    <span>Domain: {ontology.domain}</span>
                                                    <span>Quality: {(ontology.metadata.quality_score * 100).toFixed(0)}%</span>
                                                    <span>Updated: {formatDate(ontology.updated_at)}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex space-x-2">
                                                    <button className="text-blue-600 hover:text-blue-800 text-sm">View</button>
                                                    <button className="text-gray-600 hover:text-gray-800 text-sm">Edit</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Extraction Jobs */}
                        <div className="bg-white rounded-lg border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">Extraction Jobs</h3>
                            </div>
                            <div className="divide-y divide-gray-200">
                                {extractionJobs.map((job) => (
                                    <div key={job.id} className="px-6 py-4 hover:bg-gray-50 cursor-pointer">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center">
                                                {getStatusIcon(job.status)}
                                                <div className="ml-3">
                                                    <h4 className="text-sm font-medium text-gray-900">{job.name}</h4>
                                                    <p className="text-sm text-gray-600">
                                                        {job.status === 'running' && `${job.progress}% complete`}
                                                        {job.status === 'completed' && 'Completed successfully'}
                                                        {job.status === 'pending' && 'Waiting to start'}
                                                        {job.status === 'failed' && 'Failed to complete'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500">{formatDate(job.created_at)}</p>
                                                {job.status === 'running' && (
                                                    <div className="mt-1 bg-gray-200 rounded-full h-2 w-24">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                            style={{ width: `${job.progress}%` }}
                                                        ></div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'ontologies' && (
                    <div className="p-6">
                        <div className="text-center py-12">
                            <DataObjectIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Ontologies Management</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                This section will contain detailed ontology management features
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'extractions' && (
                    <div className="p-6">
                        <div className="text-center py-12">
                            <AutoAwesomeIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Extraction Jobs</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Configure and monitor AI-powered ontology extractions
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'questions' && (
                    <div className="p-6">
                        <div className="text-center py-12">
                            <SearchIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Extraction Questions</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Manage questions that guide the ontology extraction process
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="p-6">
                        <div className="text-center py-12">
                            <SettingsIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Ontology Builder Settings</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Configure extraction parameters, quality thresholds, and integration settings
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 