import React from 'react';
import { EdgeLabelRenderer, EdgeProps, getSmoothStepPath } from 'reactflow';
import { dadmsTheme } from '../../../design-system/theme';
import { OntologyEdgeData } from '../types';

const DADMSRelationshipEdge: React.FC<EdgeProps<OntologyEdgeData>> = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
    markerEnd,
}) => {
    const { relationshipType, properties, strength = 1, isInferred = false } = data || {};

    // Use smooth step path for better routing with multiple handles
    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 8,
    });

    // Determine edge color based on relationship type
    const getEdgeColor = () => {
        if (!relationshipType) return dadmsTheme.colors.border.light;

        switch (relationshipType) {
            // Decision Intelligence relationships
            case 'influences':
                return dadmsTheme.colors.accent.info;
            case 'depends_on':
                return dadmsTheme.colors.accent.warning;
            case 'conflicts_with':
                return dadmsTheme.colors.accent.error;
            case 'supports_decision':
                return dadmsTheme.colors.accent.success;
            case 'requires_approval':
                return dadmsTheme.colors.accent.secondary;

            // Organizational relationships
            case 'has_stakeholder':
            case 'has_responsibility':
            case 'has_authority':
                return '#9C27B0'; // Purple for authority/responsibility
            case 'manages':
            case 'reports_to':
                return '#FF9800'; // Orange for management hierarchy

            // Knowledge relationships
            case 'contains':
            case 'references':
                return '#4CAF50'; // Green for knowledge containment
            case 'implements':
            case 'validates':
                return '#2196F3'; // Blue for implementation/validation
            case 'contradicts':
                return '#F44336'; // Red for conflicts

            // Process relationships
            case 'triggers':
            case 'follows':
                return '#795548'; // Brown for process flow
            case 'uses_resource':
            case 'produces_output':
                return '#607D8B'; // Blue grey for resources

            // Basic OWL relationships
            case 'subclass_of':
                return '#3F51B5'; // Indigo for hierarchy
            case 'instance_of':
                return '#E91E63'; // Pink for instantiation
            case 'equivalent_to':
                return '#FF5722'; // Deep orange for equivalence

            // Generic relationships
            case 'has_property':
                return dadmsTheme.colors.accent.info;
            case 'part_of':
                return '#8BC34A'; // Light green for composition
            case 'relates_to':
                return dadmsTheme.colors.border.light;

            // Custom relationships - generate a consistent color based on the relationship name
            default:
                // Simple hash function to generate consistent colors for custom relationships
                let hash = 0;
                for (let i = 0; i < relationshipType.length; i++) {
                    const char = relationshipType.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash; // Convert to 32bit integer
                }

                // Generate a color from the hash
                const hue = Math.abs(hash) % 360;
                return `hsl(${hue}, 60%, 50%)`; // Consistent saturation and lightness
        }
    };

    const edgeColor = getEdgeColor();
    const strokeWidth = selected ? 3 : Math.max(1, 2 * strength);
    const strokeDasharray = isInferred ? '5,5' : undefined;

    // Create custom arrow marker
    const arrowId = `arrow-${id}`;
    const arrowSize = 8;

    return (
        <>
            {/* Define arrow marker */}
            <defs>
                <marker
                    id={arrowId}
                    viewBox="0 0 10 10"
                    refX="5"
                    refY="3"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                    markerUnits="strokeWidth"
                >
                    <path
                        d="M 0 0 L 0 6 L 6 3 z"
                        fill={edgeColor}
                        stroke={edgeColor}
                        strokeWidth="0.5"
                    />
                </marker>
            </defs>

            <path
                id={id}
                style={{
                    stroke: edgeColor,
                    strokeWidth,
                    strokeDasharray,
                    fill: 'none',
                    opacity: isInferred ? 0.7 : 1,
                    filter: selected ? 'drop-shadow(0 0 6px rgba(0, 123, 255, 0.6))' : undefined,
                    cursor: 'pointer',
                }}
                className="react-flow__edge-path"
                d={edgePath}
                markerEnd={`url(#${arrowId})`}
            />

            <EdgeLabelRenderer>
                {relationshipType && (
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            fontSize: dadmsTheme.typography.fontSize.xs,
                            pointerEvents: 'all',
                            background: dadmsTheme.colors.background.elevated,
                            border: `1px solid ${edgeColor}`,
                            borderRadius: dadmsTheme.borderRadius.sm,
                            padding: '2px 6px',
                            color: dadmsTheme.colors.text.primary,
                            fontFamily: dadmsTheme.typography.fontFamily.default,
                            whiteSpace: 'nowrap',
                            boxShadow: dadmsTheme.shadows.sm,
                            opacity: selected ? 1 : 0.9,
                            transition: dadmsTheme.transitions.fast,
                        }}
                        className="nodrag nopan"
                    >
                        {relationshipType.replace(/_/g, ' ')}
                        {properties?.urgency && (
                            <span style={{
                                marginLeft: dadmsTheme.spacing.xs,
                                color: dadmsTheme.colors.accent.warning,
                                fontWeight: dadmsTheme.typography.fontWeight.medium
                            }}>
                                {properties.urgency}
                            </span>
                        )}
                        {isInferred && (
                            <span style={{
                                marginLeft: dadmsTheme.spacing.xs,
                                color: dadmsTheme.colors.text.muted,
                                fontSize: '10px'
                            }}>
                                (inferred)
                            </span>
                        )}
                    </div>
                )}
            </EdgeLabelRenderer>
        </>
    );
};

export default DADMSRelationshipEdge; 