"use client";

import React, { useState } from 'react';
import { dadmsTheme } from '../../design-system/theme';
import { Icon } from '../shared/Icon';
import { useOntologyWorkspaceStore } from './store';
import { ExternalOntologyReference } from './types';

interface ExternalReferencePanelProps {
    isOpen: boolean;
    onToggle: () => void;
}

const ExternalReferencePanel: React.FC<ExternalReferencePanelProps> = ({ isOpen, onToggle }) => {
    const {
        externalReferences,
        addExternalReference,
        removeExternalReference,
        toggleExternalReference,
    } = useOntologyWorkspaceStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<ExternalOntologyReference[]>([]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);

        // Mock search implementation
        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockResults: ExternalOntologyReference[] = [
            {
                id: 'search-result-1',
                name: 'FOAF (Friend of a Friend)',
                description: 'Standard ontology for describing people and relationships',
                source: 'standard_ontologies',
                uri: 'http://xmlns.com/foaf/0.1/',
                isLoaded: false,
                isVisible: false,
                namespacePrefix: 'foaf'
            },
            {
                id: 'search-result-2',
                name: 'Dublin Core Terms',
                description: 'Metadata terms for describing resources',
                source: 'standard_ontologies',
                uri: 'http://purl.org/dc/terms/',
                isLoaded: false,
                isVisible: false,
                namespacePrefix: 'dcterms'
            }
        ];

        setSearchResults(mockResults);
        setIsSearching(false);
    };

    const handleAddReference = (reference: ExternalOntologyReference) => {
        addExternalReference({
            ...reference,
            id: `ref-${Date.now()}`,
            isLoaded: false,
            isVisible: true,
        });
        setSearchResults(searchResults.filter(r => r.id !== reference.id));
    };

    const containerStyle = {
        width: isOpen ? '320px' : '0px',
        height: '100%',
        background: dadmsTheme.colors.background.secondary,
        borderLeft: `1px solid ${dadmsTheme.colors.border.default}`,
        display: 'flex',
        flexDirection: 'column' as const,
        transition: dadmsTheme.transitions.normal,
        overflow: 'hidden',
        zIndex: dadmsTheme.zIndex.elevated,
    };

    const headerStyle = {
        padding: dadmsTheme.spacing.md,
        borderBottom: `1px solid ${dadmsTheme.colors.border.default}`,
        background: dadmsTheme.colors.background.tertiary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    };

    const titleStyle = {
        fontSize: dadmsTheme.typography.fontSize.md,
        fontWeight: dadmsTheme.typography.fontWeight.semibold,
        color: dadmsTheme.colors.text.primary,
        fontFamily: dadmsTheme.typography.fontFamily.default,
    };

    const contentStyle = {
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
        overflowY: 'auto' as const,
    };

    const searchSectionStyle = {
        padding: dadmsTheme.spacing.md,
        borderBottom: `1px solid ${dadmsTheme.colors.border.default}`,
        background: dadmsTheme.colors.background.primary,
    };

    const inputStyle = {
        width: '100%',
        padding: dadmsTheme.spacing.xs,
        background: dadmsTheme.colors.background.secondary,
        border: `1px solid ${dadmsTheme.colors.border.default}`,
        borderRadius: dadmsTheme.borderRadius.sm,
        color: dadmsTheme.colors.text.primary,
        fontSize: dadmsTheme.typography.fontSize.sm,
        fontFamily: dadmsTheme.typography.fontFamily.default,
        marginBottom: dadmsTheme.spacing.sm,
    };

    const buttonStyle = (variant: 'primary' | 'secondary' = 'secondary', size: 'sm' | 'xs' = 'sm', disabled = false) => ({
        padding: size === 'xs' ? '2px 6px' : `${dadmsTheme.spacing.xs} ${dadmsTheme.spacing.sm}`,
        background: disabled
            ? dadmsTheme.colors.background.tertiary
            : variant === 'primary'
                ? dadmsTheme.colors.accent.primary
                : dadmsTheme.colors.background.tertiary,
        border: `1px solid ${disabled
            ? dadmsTheme.colors.border.default
            : variant === 'primary'
                ? dadmsTheme.colors.accent.primary
                : dadmsTheme.colors.border.default
            }`,
        borderRadius: dadmsTheme.borderRadius.sm,
        color: disabled
            ? dadmsTheme.colors.text.muted
            : variant === 'primary'
                ? dadmsTheme.colors.text.inverse
                : dadmsTheme.colors.text.primary,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: size === 'xs' ? '10px' : dadmsTheme.typography.fontSize.xs,
        transition: dadmsTheme.transitions.fast,
        opacity: disabled ? 0.6 : 1,
    });

    const referenceItemStyle = (isVisible: boolean) => ({
        padding: dadmsTheme.spacing.sm,
        margin: dadmsTheme.spacing.xs,
        background: dadmsTheme.colors.background.primary,
        border: `1px solid ${dadmsTheme.colors.border.default}`,
        borderRadius: dadmsTheme.borderRadius.sm,
        opacity: isVisible ? 1 : 0.6,
    });

    const referenceHeaderStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: dadmsTheme.spacing.xs,
    };

    const referenceNameStyle = {
        fontSize: dadmsTheme.typography.fontSize.sm,
        fontWeight: dadmsTheme.typography.fontWeight.medium,
        color: dadmsTheme.colors.text.primary,
    };

    const referenceDescStyle = {
        fontSize: dadmsTheme.typography.fontSize.xs,
        color: dadmsTheme.colors.text.secondary,
        marginBottom: dadmsTheme.spacing.xs,
    };

    const referenceMetaStyle = {
        fontSize: dadmsTheme.typography.fontSize.xs,
        color: dadmsTheme.colors.text.muted,
        display: 'flex',
        alignItems: 'center',
        gap: dadmsTheme.spacing.sm,
    };

    const sectionTitleStyle = {
        padding: dadmsTheme.spacing.sm,
        fontSize: dadmsTheme.typography.fontSize.sm,
        fontWeight: dadmsTheme.typography.fontWeight.medium,
        color: dadmsTheme.colors.text.primary,
        background: dadmsTheme.colors.background.tertiary,
        borderBottom: `1px solid ${dadmsTheme.colors.border.default}`,
    };

    if (!isOpen) {
        return (
            <div style={{ ...containerStyle, width: '0px' }}>
                {/* Collapsed state */}
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <div style={titleStyle}>External References</div>
                <button
                    style={buttonStyle('secondary', 'xs')}
                    onClick={onToggle}
                    title="Close external references panel"
                >
                    ×
                </button>
            </div>

            <div style={contentStyle}>
                <div style={searchSectionStyle}>
                    <input
                        style={inputStyle}
                        placeholder="Search external ontologies..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSearch();
                        }}
                    />
                    <button
                        style={buttonStyle('primary', 'sm', isSearching || !searchQuery.trim())}
                        onClick={handleSearch}
                        disabled={isSearching || !searchQuery.trim()}
                    >
                        <Icon name="search" size="sm" />
                        {isSearching ? 'Searching...' : 'Search'}
                    </button>
                </div>

                {searchResults.length > 0 && (
                    <>
                        <div style={sectionTitleStyle}>Search Results</div>
                        <div style={{ padding: dadmsTheme.spacing.sm }}>
                            {searchResults.map((result) => (
                                <div key={result.id} style={referenceItemStyle(true)}>
                                    <div style={referenceHeaderStyle}>
                                        <div style={referenceNameStyle}>{result.name}</div>
                                        <button
                                            style={buttonStyle('primary', 'xs')}
                                            onClick={() => handleAddReference(result)}
                                            title="Add as reference"
                                        >
                                            + Add
                                        </button>
                                    </div>
                                    <div style={referenceDescStyle}>{result.description}</div>
                                    <div style={referenceMetaStyle}>
                                        <span>{result.source.replace(/_/g, ' ')}</span>
                                        <span>•</span>
                                        <span>{result.namespacePrefix}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {externalReferences.length > 0 && (
                    <>
                        <div style={sectionTitleStyle}>Referenced Ontologies</div>
                        <div style={{ padding: dadmsTheme.spacing.sm }}>
                            {externalReferences.map((reference) => (
                                <div key={reference.id} style={referenceItemStyle(reference.isVisible)}>
                                    <div style={referenceHeaderStyle}>
                                        <div style={referenceNameStyle}>{reference.name}</div>
                                        <div style={{ display: 'flex', gap: dadmsTheme.spacing.xs }}>
                                            <button
                                                style={buttonStyle('secondary', 'xs')}
                                                onClick={() => toggleExternalReference(reference.id)}
                                                title={reference.isVisible ? 'Hide from canvas' : 'Show on canvas'}
                                            >
                                                {reference.isVisible ? '👁' : '👁‍🗨'}
                                            </button>
                                            <button
                                                style={buttonStyle('secondary', 'xs')}
                                                onClick={() => removeExternalReference(reference.id)}
                                                title="Remove reference"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                    <div style={referenceDescStyle}>{reference.description}</div>
                                    <div style={referenceMetaStyle}>
                                        <span>{reference.source.replace(/_/g, ' ')}</span>
                                        <span>•</span>
                                        <span>{reference.namespacePrefix}</span>
                                        <span>•</span>
                                        <span style={{ color: reference.isLoaded ? dadmsTheme.colors.status.active : dadmsTheme.colors.status.inactive }}>
                                            {reference.isLoaded ? 'Loaded' : 'Referenced'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {externalReferences.length === 0 && searchResults.length === 0 && (
                    <div style={{
                        textAlign: 'center' as const,
                        color: dadmsTheme.colors.text.muted,
                        fontSize: dadmsTheme.typography.fontSize.sm,
                        padding: dadmsTheme.spacing.xl,
                    }}>
                        <div style={{ marginBottom: dadmsTheme.spacing.md }}>
                            <Icon name="type-hierarchy" size="xl" />
                        </div>
                        <div>No external references added</div>
                        <div style={{ fontSize: dadmsTheme.typography.fontSize.xs, marginTop: dadmsTheme.spacing.sm, color: dadmsTheme.colors.text.muted }}>
                            Search and add external ontologies to reference in your model
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExternalReferencePanel; 