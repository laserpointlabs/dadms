import React from 'react';
import { EdgeLabelRenderer, EdgeProps, getBezierPath } from 'reactflow';
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

    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    // Determine edge color based on relationship type
    const getEdgeColor = () => {
        switch (relationshipType) {
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
            default:
                return dadmsTheme.colors.border.light;
        }
    };

    const edgeColor = getEdgeColor();
    const strokeWidth = selected ? 3 : Math.max(1, 2 * strength);
    const strokeDasharray = isInferred ? '5,5' : undefined;

    return (
        <>
            <path
                id={id}
                style={{
                    stroke: edgeColor,
                    strokeWidth,
                    strokeDasharray,
                    fill: 'none',
                    opacity: isInferred ? 0.7 : 1,
                    filter: selected ? 'drop-shadow(0 0 6px rgba(0, 123, 255, 0.6))' : undefined,
                }}
                className="react-flow__edge-path"
                d={edgePath}
                markerEnd={markerEnd}
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