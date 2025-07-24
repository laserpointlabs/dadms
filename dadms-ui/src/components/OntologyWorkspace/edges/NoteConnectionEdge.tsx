"use client";

import React from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps } from 'reactflow';
import { dadmsTheme } from '../../../design-system/theme';

const NoteConnectionEdge: React.FC<EdgeProps> = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
}) => {
    // Create straight line path instead of bezier curve
    const edgePath = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;

    // Calculate label position at the middle of the straight line
    const labelX = (sourceX + targetX) / 2;
    const labelY = (sourceY + targetY) / 2;

    return (
        <>
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    stroke: dadmsTheme.colors.accent.secondary,
                    strokeWidth: 2,
                    strokeDasharray: '5,5', // Creates dotted line
                    opacity: 0.7,
                }}
            />
            {data?.label && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            fontSize: dadmsTheme.typography.fontSize.xs,
                            fontWeight: dadmsTheme.typography.fontWeight.medium,
                            color: dadmsTheme.colors.text.secondary,
                            backgroundColor: dadmsTheme.colors.background.primary,
                            padding: '2px 6px',
                            borderRadius: dadmsTheme.borderRadius.sm,
                            border: `1px solid ${dadmsTheme.colors.border.light}`,
                            pointerEvents: 'all',
                            whiteSpace: 'nowrap',
                        }}
                        className="nodrag nopan"
                    >
                        {data.label}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
};

export default NoteConnectionEdge; 