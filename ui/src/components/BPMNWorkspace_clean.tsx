import React, { useCallback, useRef, useState } from 'react';
import './BPMNWorkspace.css';

const BPMNWorkspace: React.FC = () => {
    const [leftPanelWidth, setLeftPanelWidth] = useState(30); // 30%
    const [isDragging, setIsDragging] = useState(false);
    const splitterRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        setIsDragging(true);
        e.preventDefault();
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;

        const containerRect = document.querySelector('.workspace-content')?.getBoundingClientRect();
        if (!containerRect) return;

        const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

        // Constrain between 10% and 90%
        const constrainedWidth = Math.max(10, Math.min(90, newLeftWidth));
        setLeftPanelWidth(constrainedWidth);
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    React.useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return (
        <div className="bpmn-workspace">
            <div className="workspace-header">
                <h2>BPMN Workspace</h2>
                <p>Draggable vertical splitter - {leftPanelWidth.toFixed(0)}% | {(100 - leftPanelWidth).toFixed(0)}%</p>
            </div>

            <div className="workspace-content">
                {/* Left Panel */}
                <div
                    className="left-panel"
                    style={{ width: `${leftPanelWidth}%` }}
                >
                    <div className="panel-content">
                        <h3>Left Panel</h3>
                        <p>This is the left panel ({leftPanelWidth.toFixed(0)}%)</p>
                        <p>Ready for content implementation.</p>
                    </div>
                </div>

                {/* Vertical Splitter */}
                <div
                    ref={splitterRef}
                    className={`vertical-splitter ${isDragging ? 'dragging' : ''}`}
                    onMouseDown={handleMouseDown}
                />

                {/* Right Panel */}
                <div
                    className="right-panel"
                    style={{ width: `${100 - leftPanelWidth}%` }}
                >
                    <div className="panel-content">
                        <h3>Right Panel</h3>
                        <p>This is the right panel ({(100 - leftPanelWidth).toFixed(0)}%)</p>
                        <p>Ready for content implementation.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BPMNWorkspace;
