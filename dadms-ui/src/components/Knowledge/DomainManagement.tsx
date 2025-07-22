import React, { useEffect, useState } from 'react';
import { Button, Card, Icon } from '../shared';

interface Domain {
    id: string;
    name: string;
    description: string;
    documentCount: number;
    createdAt: string;
}

const MOCK_DOMAINS: Domain[] = [
    {
        id: '1',
        name: 'Strategic Planning',
        description: 'Documents related to organizational strategy and planning processes.',
        documentCount: 24,
        createdAt: '2024-01-15T10:00:00Z'
    },
    {
        id: '2',
        name: 'Technical Architecture',
        description: 'Engineering and technical documentation for system design.',
        documentCount: 18,
        createdAt: '2024-01-10T14:30:00Z'
    }
];

const DomainManagement: React.FC = () => {
    const [domains, setDomains] = useState<Domain[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'create' | 'edit' | 'delete'>('create');
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [editTarget, setEditTarget] = useState<Domain | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Domain | null>(null);

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setDomains(MOCK_DOMAINS);
            setLoading(false);
        }, 1000);
    }, []);

    const handleCreate = () => {
        setModalType('create');
        setFormData({ name: '', description: '' });
        setShowModal(true);
    };

    const handleEdit = (domain: Domain) => {
        setModalType('edit');
        setEditTarget(domain);
        setFormData({ name: domain.name, description: domain.description });
        setShowModal(true);
    };

    const handleDelete = (domain: Domain) => {
        setModalType('delete');
        setDeleteTarget(domain);
        setShowModal(true);
    };

    const handleSubmit = () => {
        if (modalType === 'create') {
            const newDomain: Domain = {
                id: Date.now().toString(),
                name: formData.name,
                description: formData.description,
                documentCount: 0,
                createdAt: new Date().toISOString()
            };
            setDomains([...domains, newDomain]);
        } else if (modalType === 'edit' && editTarget) {
            setDomains(domains.map(d =>
                d.id === editTarget.id
                    ? { ...d, name: formData.name, description: formData.description }
                    : d
            ));
        } else if (modalType === 'delete' && deleteTarget) {
            setDomains(domains.filter(d => d.id !== deleteTarget.id));
        }

        setShowModal(false);
        setFormData({ name: '', description: '' });
        setEditTarget(null);
        setDeleteTarget(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Icon name="loading" size="lg" className="text-theme-accent-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-theme-text-primary">Knowledge Domains</h2>
                <Button variant="primary" leftIcon="add" onClick={handleCreate}>
                    Create Domain
                </Button>
            </div>

            {domains.length === 0 ? (
                <Card variant="outlined" padding="lg">
                    <div className="text-center py-8">
                        <Icon name="folder" size="xl" className="text-theme-text-muted mb-4" />
                        <p className="text-theme-text-secondary mb-4">No domains yet</p>
                        <Button variant="primary" leftIcon="add" onClick={handleCreate}>
                            Create your first domain
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {domains.map((domain) => (
                        <Card key={domain.id} variant="outlined" padding="md">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-medium text-theme-text-primary mb-1">{domain.name}</h3>
                                    <div className="text-xs text-theme-text-muted">{domain.documentCount} documents</div>
                                    <p className="text-sm text-theme-text-secondary">{domain.description}</p>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-theme-border">
                                    <span className="text-xs text-theme-text-muted">
                                        Created {new Date(domain.createdAt).toLocaleDateString()}
                                    </span>
                                    <div className="flex gap-1">
                                        <Button size="sm" variant="tertiary" leftIcon="edit" onClick={() => handleEdit(domain)} />
                                        <Button size="sm" variant="danger" leftIcon="trash" onClick={() => handleDelete(domain)} />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-theme-surface rounded-lg shadow-xl max-w-md w-full border border-theme-border">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-semibold text-theme-text-primary">
                                    {modalType === 'create' ? 'Create Domain' :
                                        modalType === 'edit' ? 'Edit Domain' : 'Delete Domain'}
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                                >
                                    <Icon name="close" size="sm" />
                                </button>
                            </div>

                            {modalType === 'delete' ? (
                                <div>
                                    <p className="text-theme-text-secondary mb-6">
                                        Are you sure you want to delete <strong className="text-theme-text-primary">{deleteTarget?.name}</strong>?
                                        This action cannot be undone.
                                    </p>
                                    <div className="flex gap-3">
                                        <Button variant="tertiary" onClick={() => setShowModal(false)} className="flex-1">
                                            Cancel
                                        </Button>
                                        <Button variant="danger" onClick={handleSubmit} className="flex-1">
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-theme-text-primary mb-1">
                                            Domain Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-theme-input-bg border border-theme-input-border rounded px-3 py-2 text-theme-text-primary placeholder-theme-text-muted focus:border-theme-accent-primary focus:outline-none"
                                            placeholder="Enter domain name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-theme-text-primary mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={3}
                                            className="w-full bg-theme-input-bg border border-theme-input-border rounded px-3 py-2 text-theme-text-primary placeholder-theme-text-muted focus:border-theme-accent-primary focus:outline-none"
                                            placeholder="Enter domain description"
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <Button variant="tertiary" onClick={() => setShowModal(false)} className="flex-1">
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="primary"
                                            onClick={handleSubmit}
                                            className="flex-1"
                                            disabled={!formData.name.trim()}
                                        >
                                            {modalType === 'create' ? 'Create' : 'Save'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DomainManagement; 