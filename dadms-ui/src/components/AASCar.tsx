"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAgentAssistant } from "../contexts/AgentAssistantContext";
import { useTheme } from "../contexts/ThemeContext";
import { CodiconName, Icon } from "./shared/Icon";

const TAB_ERRORS = "errors";
const TAB_INFO = "info";
const TAB_AAS = "assistant";

const TABS = [
    { id: TAB_ERRORS, name: "Errors", icon: "warning", description: "System issues" },
    { id: TAB_INFO, name: "Info", icon: "info", description: "System status" },
    { id: TAB_AAS, name: "Assistant", icon: "robot", description: "AI assistance" },
];

export default function AASCar() {
    const { theme } = useTheme();
    const { isDocked: contextIsDocked, dockedHeight: contextDockedHeight, setIsDocked: setContextIsDocked, setDockedHeight: setContextDockedHeight } = useAgentAssistant();

    // Initialize local state from context (which loads from localStorage)
    const [visible, setVisible] = useState(!contextIsDocked); // If docked, don't show floating
    const [height, setHeight] = useState(contextDockedHeight || 280);
    const [position, setPosition] = useState({ x: 400, y: 100 });
    const [activeTab, setActiveTab] = useState(TAB_AAS);
    const [aasInput, setAasInput] = useState("");
    const [isMinimized, setIsMinimized] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isDetached, setIsDetached] = useState(false);
    const [isDocked, setIsDocked] = useState(contextIsDocked);
    const [isInitialized, setIsInitialized] = useState(false);
    const detachedWindowRef = useRef<Window | null>(null);
    const dragRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const startY = useRef<number | null>(null);
    const startHeight = useRef<number>(height);
    const startPosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const startMouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    // Initialize position after mount to avoid hydration issues
    useEffect(() => {
        if (!isInitialized && typeof window !== 'undefined') {
            setPosition({
                x: Math.max(20, window.innerWidth - 420),
                y: Math.max(20, window.innerHeight - 300)
            });
            setIsInitialized(true);
        }
    }, [isInitialized]);

    // Sync with context state changes (from other instances or localStorage)
    useEffect(() => {
        setIsDocked(contextIsDocked);
        setHeight(contextDockedHeight || 280);
        // If context says we're docked, make sure we're visible
        if (contextIsDocked) {
            setVisible(true);
            setIsDetached(false);
        }
    }, [contextIsDocked, contextDockedHeight]);

    // Update context when local state changes, but avoid loops
    useEffect(() => {
        if (isDocked !== contextIsDocked) {
            setContextIsDocked(isDocked);
        }

        const currentHeight = isMinimized ? 48 : height;
        if (isDocked && currentHeight !== contextDockedHeight) {
            setContextDockedHeight(currentHeight);
        } else if (!isDocked && contextDockedHeight !== 0) {
            setContextDockedHeight(0);
        }
    }, [isDocked, height, isMinimized, contextIsDocked, contextDockedHeight, setContextIsDocked, setContextDockedHeight]);

    // Function to open agent assistant in separate window
    const openDetachedWindow = () => {
        if (detachedWindowRef.current && !detachedWindowRef.current.closed) {
            detachedWindowRef.current.focus();
            return;
        }

        const windowFeatures = [
            'width=420',
            'height=350',
            'left=100',
            'top=100',
            'resizable=yes',
            'scrollbars=no',
            'toolbar=no',
            'menubar=no',
            'location=no',
            'status=no',
            'titlebar=yes'
        ].join(',');

        const newWindow = window.open('', 'DADMS_Agent_Assistant', windowFeatures);

        if (!newWindow) {
            alert('Popup blocked! Please allow popups for this site to use the detached agent assistant.');
            return;
        }

        detachedWindowRef.current = newWindow;
        setIsDetached(true);
        setVisible(false);
        setIsDocked(false);

        // Set up the detached window content
        setupDetachedWindow(newWindow);

        // Handle window close
        newWindow.addEventListener('beforeunload', () => {
            setIsDetached(false);
            detachedWindowRef.current = null;
        });
    };

    const setupDetachedWindow = (win: Window) => {
        const doc = win.document;
        doc.title = 'DADMS Agent Assistant';

        // Use theme variables for styling
        const isDarkTheme = theme === 'dark';
        const themeVars = isDarkTheme ? {
            '--bg-primary': '#1e1e1e',
            '--bg-secondary': '#252526',
            '--bg-tertiary': '#333333',
            '--surface': '#2d2d30',
            '--surface-hover': '#3e3e42',
            '--text-primary': '#d4d4d4',
            '--text-secondary': '#cccccc',
            '--text-muted': '#6e7681',
            '--border': '#2d2d30',
            '--accent-primary': '#007acc',
            '--accent-success': '#4caf50',
            '--input-bg': '#3c3c3c',
            '--input-border': '#2d2d30'
        } : {
            '--bg-primary': '#ffffff',
            '--bg-secondary': '#f8f9fa',
            '--bg-tertiary': '#e9ecef',
            '--surface': '#ffffff',
            '--surface-hover': '#f8f9fa',
            '--text-primary': '#1f2328',
            '--text-secondary': '#656d76',
            '--text-muted': '#8b949e',
            '--border': '#d1d9e0',
            '--accent-primary': '#0969da',
            '--accent-success': '#1a7f37',
            '--input-bg': '#ffffff',
            '--input-border': '#d8dee4'
        };

        // Add styles
        doc.head.innerHTML = `
            <style>
                :root {
                    ${Object.entries(themeVars).map(([key, value]) => `${key}: ${value};`).join('')}
                }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    background: var(--bg-primary); 
                    color: var(--text-primary); 
                    height: 100vh; 
                    overflow: hidden;
                }
                .container { 
                    height: 100vh; 
                    display: flex; 
                    flex-direction: column; 
                    border: 1px solid var(--border);
                }
                .header { 
                    background: var(--bg-secondary); 
                    padding: 8px 12px; 
                    border-bottom: 1px solid var(--border); 
                    display: flex; 
                    align-items: center; 
                    justify-content: space-between;
                    cursor: move;
                }
                .header h3 { 
                    font-size: 13px; 
                    font-weight: 600; 
                    color: var(--text-primary);
                }
                .close-btn { 
                    background: none; 
                    border: none; 
                    color: var(--text-secondary); 
                    cursor: pointer; 
                    padding: 4px 8px; 
                    border-radius: 2px; 
                }
                .close-btn:hover { 
                    background: var(--surface-hover); 
                    color: var(--text-primary);
                }
                .tabs { 
                    display: flex; 
                    background: var(--surface); 
                    border-bottom: 1px solid var(--border); 
                }
                .tab { 
                    padding: 8px 16px; 
                    cursor: pointer; 
                    border-right: 1px solid var(--border); 
                    font-size: 12px;
                    color: var(--text-secondary);
                }
                .tab:hover { 
                    background: var(--surface-hover); 
                    color: var(--text-primary);
                }
                .tab.active { 
                    background: var(--bg-primary); 
                    border-bottom: 2px solid var(--accent-primary); 
                    color: var(--text-primary);
                }
                .content { 
                    flex: 1; 
                    padding: 12px; 
                    overflow-y: auto; 
                    background: var(--bg-primary);
                }
                .input-area { 
                    border-top: 1px solid var(--border); 
                    padding: 8px; 
                    background: var(--bg-secondary);
                }
                .input-box { 
                    width: 100%; 
                    background: var(--input-bg); 
                    border: 1px solid var(--input-border); 
                    color: var(--text-primary); 
                    padding: 8px; 
                    border-radius: 2px; 
                    font-family: inherit;
                    resize: none;
                }
                .input-box:focus { 
                    outline: none; 
                    border-color: var(--accent-primary); 
                }
                .send-btn { 
                    background: var(--accent-primary); 
                    border: none; 
                    color: white; 
                    padding: 4px 12px; 
                    margin-top: 4px; 
                    border-radius: 2px; 
                    cursor: pointer; 
                    font-size: 12px;
                }
                .send-btn:hover { 
                    opacity: 0.9; 
                }
                .message { 
                    margin-bottom: 8px; 
                    padding: 6px; 
                    border-radius: 2px; 
                    font-size: 12px; 
                    line-height: 1.4;
                }
                .assistant-message { 
                    background: var(--surface); 
                    border-left: 3px solid var(--accent-primary); 
                    color: var(--text-primary);
                }
                .user-message { 
                    background: var(--surface-hover); 
                    border-left: 3px solid var(--accent-success); 
                    color: var(--text-primary);
                }
                .icon {
                    display: inline-block;
                    margin-right: 4px;
                }
            </style>
        `;

        // Add content
        doc.body.innerHTML = `
            <div class="container">
                <div class="header">
                    <h3><span class="icon">🔧</span>DADMS Agent Assistant</h3>
                    <button class="close-btn" onclick="window.close()">×</button>
                </div>
                <div class="tabs">
                    <div class="tab active" data-tab="assistant">Assistant</div>
                    <div class="tab" data-tab="errors">Errors</div>
                    <div class="tab" data-tab="info">Info</div>
                </div>
                <div class="content" id="content">
                    <div class="message assistant-message">
                        <strong>DADMS Agent Assistant:</strong> I'm your AI assistant running in a separate window. 
                        I can help you with decision analysis, process management, and system navigation.
                        <br><br>
                        <strong>Benefits of detached mode:</strong><br>
                        • Takes no space in your main browser<br>
                        • Always visible while you work<br>
                        • Can be positioned anywhere on your desktop<br>
                        • Persistent across browser tabs
                    </div>
                </div>
                <div class="input-area">
                    <textarea class="input-box" id="messageInput" placeholder="Ask me anything about DADMS..." rows="2"></textarea>
                    <button class="send-btn" onclick="sendMessage()">Send</button>
                </div>
            </div>
        `;

        // Add JavaScript functionality
        const script = doc.createElement('script');
        script.textContent = `
            let activeTab = 'assistant';
            
            function sendMessage() {
                const input = document.getElementById('messageInput');
                const content = document.getElementById('content');
                const message = input.value.trim();
                
                if (!message) return;
                
                // Add user message
                const userDiv = document.createElement('div');
                userDiv.className = 'message user-message';
                userDiv.innerHTML = '<strong>You:</strong> ' + message;
                content.appendChild(userDiv);
                
                // Add assistant response
                setTimeout(() => {
                    const assistantDiv = document.createElement('div');
                    assistantDiv.className = 'message assistant-message';
                    assistantDiv.innerHTML = '<strong>Assistant:</strong> I received your message: "' + message + '". In a full implementation, I would provide intelligent responses and can execute actions in the main DADMS interface.';
                    content.appendChild(assistantDiv);
                    content.scrollTop = content.scrollHeight;
                }, 500);
                
                input.value = '';
                content.scrollTop = content.scrollHeight;
            }
            
            // Handle Enter key
            document.getElementById('messageInput').addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });
            
            // Tab switching
            document.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', function() {
                    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                    
                    const content = document.getElementById('content');
                    const tabType = this.dataset.tab;
                    
                    if (tabType === 'errors') {
                        content.innerHTML = '<div class="message assistant-message"><strong>System Status:</strong><br>• No errors detected<br>• All services running normally<br>• Last check: ' + new Date().toLocaleTimeString() + '</div>';
                    } else if (tabType === 'info') {
                        content.innerHTML = '<div class="message assistant-message"><strong>DADMS Information:</strong><br>• Version: 2.0.0-alpha.2<br>• Mode: Development<br>• UI Theme: ${theme === 'dark' ? 'Dark' : 'Light'}<br>• Agent Assistant: Detached Mode</div>';
                    } else {
                        content.innerHTML = '<div class="message assistant-message"><strong>DADMS Agent Assistant:</strong> I\\'m your AI assistant running in a separate window. I can help you with decision analysis, process management, and system navigation.<br><br><strong>Benefits of detached mode:</strong><br>• Takes no space in your main browser<br>• Always visible while you work<br>• Can be positioned anywhere on your desktop<br>• Persistent across browser tabs</div>';
                    }
                });
            });
        `;
        doc.head.appendChild(script);

        // Focus the window
        win.focus();
    };

    const handleDocking = () => {
        const newDockedState = !isDocked;
        setIsDocked(newDockedState);
        setVisible(true);
        setIsDetached(false);
        if (detachedWindowRef.current && !detachedWindowRef.current.closed) {
            detachedWindowRef.current.close();
        }
    };

    const handleResizeDragStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        startY.current = e.clientY;
        startHeight.current = height;
        document.body.style.cursor = "ns-resize";
        document.body.style.userSelect = "none";

        const handleDragMove = (e: MouseEvent) => {
            if (startY.current !== null) {
                const deltaY = startY.current - e.clientY;
                const newHeight = Math.max(120, Math.min(600, startHeight.current + deltaY));
                setHeight(newHeight);
            }
        };

        const handleDragEnd = () => {
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            startY.current = null;
            window.removeEventListener("mousemove", handleDragMove);
            window.removeEventListener("mouseup", handleDragEnd);
        };

        window.addEventListener("mousemove", handleDragMove);
        window.addEventListener("mouseup", handleDragEnd);
    };

    const handlePositionDragStart = (e: React.MouseEvent) => {
        if (isDocked) return; // Don't allow dragging when docked

        e.preventDefault();
        setIsDragging(true);
        startMouse.current = { x: e.clientX, y: e.clientY };
        startPosition.current = { x: position.x, y: position.y };
        document.body.style.cursor = "grabbing";
        document.body.style.userSelect = "none";

        const handleDragMove = (e: MouseEvent) => {
            const deltaX = e.clientX - startMouse.current.x;
            const deltaY = e.clientY - startMouse.current.y;

            const newX = startPosition.current.x + deltaX;
            const newY = startPosition.current.y + deltaY;

            setPosition({ x: newX, y: newY });
        };

        const handleDragEnd = () => {
            setIsDragging(false);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            window.removeEventListener("mousemove", handleDragMove);
            window.removeEventListener("mouseup", handleDragEnd);
        };

        window.addEventListener("mousemove", handleDragMove);
        window.addEventListener("mouseup", handleDragEnd);
    };

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            // Component position remains unchanged during window resize
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [height, isMinimized]);

    // Monitor detached window status
    useEffect(() => {
        if (!isDetached || !detachedWindowRef.current) return;

        const checkWindowStatus = () => {
            if (detachedWindowRef.current && detachedWindowRef.current.closed) {
                setIsDetached(false);
                detachedWindowRef.current = null;
            }
        };

        const interval = setInterval(checkWindowStatus, 1000);
        return () => clearInterval(interval);
    }, [isDetached]);

    const handleAasSend = () => {
        if (aasInput.trim()) {
            console.log("AAS User Input:", aasInput);
            setAasInput("");
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAasSend();
        }
    };

    const resetPosition = () => {
        if (typeof window !== 'undefined') {
            setPosition({
                x: Math.max(20, window.innerWidth - 420),
                y: Math.max(20, window.innerHeight - 300)
            });
        }
    };

    // Show control buttons when not visible
    if (!visible && !isDetached && !isDocked) {
        return (
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                <button
                    onClick={openDetachedWindow}
                    className="bg-theme-surface border border-theme-border-light text-theme-text-primary hover:bg-theme-surface-hover shadow-lg px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors"
                    title="Open Agent Assistant in separate window"
                >
                    <Icon name="ellipsis" size="sm" />
                    Detach Assistant
                </button>
                <button
                    onClick={handleDocking}
                    className="bg-theme-surface border border-theme-border-light text-theme-text-primary hover:bg-theme-surface-hover shadow-lg px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors"
                    title="Dock Agent Assistant to bottom"
                >
                    <Icon name="arrow-down" size="sm" />
                    Dock Assistant
                </button>
                <button
                    onClick={() => setVisible(true)}
                    onDoubleClick={() => {
                        setVisible(true);
                        resetPosition();
                    }}
                    className="bg-theme-accent-primary text-white hover:opacity-90 shadow-lg px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-opacity"
                    title="Show Agent Assistant (Double-click to reset position)"
                >
                    <Icon name="robot" size="sm" />
                    Assistant
                </button>
            </div>
        );
    }

    // Show detached indicator
    if (isDetached) {
        return (
            <button
                onClick={() => {
                    if (detachedWindowRef.current && !detachedWindowRef.current.closed) {
                        detachedWindowRef.current.focus();
                    } else {
                        setIsDetached(false);
                        setVisible(true);
                    }
                }}
                className="fixed bottom-4 right-4 bg-theme-surface border border-theme-border-light text-theme-text-primary hover:bg-theme-surface-hover shadow-lg z-50 px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors"
                title="Agent Assistant is detached (Click to focus or restore)"
            >
                <Icon name="ellipsis" size="sm" />
                Assistant (Detached)
            </button>
        );
    }

    // Docked mode - appears at bottom of screen
    if (isDocked) {
        const displayHeight = isMinimized ? 48 : height;

        return (
            <div
                className="fixed bottom-0 left-0 right-0 z-40 flex flex-col overflow-hidden border-t border-theme-border bg-theme-surface"
                style={{
                    height: displayHeight + 'px',
                    transition: isMinimized ? 'height 0.3s ease' : 'none'
                }}
            >
                {/* Resize Handle */}
                {!isMinimized && (
                    <div
                        onMouseDown={handleResizeDragStart}
                        className="h-1 bg-theme-border hover:bg-theme-accent-primary cursor-ns-resize transition-colors relative group"
                        title="Drag to resize"
                    >
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-8 h-0.5 bg-theme-text-muted rounded"></div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div
                    className="px-3 py-2 flex items-center justify-between bg-theme-bg-secondary border-b border-theme-border select-none"
                    title="Docked Agent Assistant"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 flex items-center justify-center bg-theme-accent-primary rounded-sm">
                            <Icon name="robot" size="sm" className="text-white" />
                        </div>
                        <h3 className="text-sm font-medium text-theme-text-primary">Agent Assistant (Docked)</h3>
                        <div className="w-2 h-2 bg-theme-accent-success rounded-full" title="Active" />
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={openDetachedWindow}
                            className="p-1 hover:bg-theme-surface-hover rounded text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                            title="Open in separate window"
                        >
                            <Icon name="ellipsis" size="sm" />
                        </button>
                        <button
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="p-1 hover:bg-theme-surface-hover rounded text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                            title={isMinimized ? "Expand" : "Minimize"}
                        >
                            <Icon name={isMinimized ? "arrow-up" : "chevron-down"} size="sm" />
                        </button>
                        <button
                            onClick={handleDocking}
                            className="p-1 hover:bg-theme-surface-hover rounded text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                            title="Undock"
                        >
                            <Icon name="arrow-up" size="sm" />
                        </button>
                        <button
                            onClick={() => {
                                setVisible(false);
                                setIsDocked(false);
                            }}
                            className="p-1 hover:bg-theme-surface-hover rounded text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                            title="Close"
                        >
                            <Icon name="close" size="sm" />
                        </button>
                    </div>
                </div>

                {!isMinimized && (
                    <>
                        {/* Tab Navigation */}
                        <div className="bg-theme-bg-primary border-b border-theme-border px-2">
                            <nav className="flex">
                                {TABS.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                                            px-3 py-2 text-xs font-medium transition-all duration-200 border-b-2 flex items-center gap-1
                                            ${activeTab === tab.id
                                                ? 'text-theme-accent-primary border-theme-accent-primary bg-theme-surface'
                                                : 'text-theme-text-secondary border-transparent hover:text-theme-accent-primary hover:border-theme-border-light'
                                            }
                                        `}
                                        title={tab.description}
                                    >
                                        <Icon name={tab.icon as CodiconName} size="sm" />
                                        {tab.name}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-auto">
                            {activeTab === TAB_ERRORS && (
                                <div className="p-4">
                                    <div className="text-center py-8">
                                        <div className="w-12 h-12 bg-theme-accent-success bg-opacity-20 rounded-lg flex items-center justify-center mx-auto mb-3">
                                            <Icon name="check" size="lg" className="text-theme-accent-success" />
                                        </div>
                                        <p className="text-sm text-theme-text-secondary">No errors detected</p>
                                        <p className="text-xs text-theme-text-muted mt-1">System running normally</p>
                                    </div>
                                </div>
                            )}

                            {activeTab === TAB_INFO && (
                                <div className="p-4 space-y-3">
                                    <div className="text-xs space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-theme-text-secondary">System Status:</span>
                                            <span className="px-2 py-1 bg-theme-accent-success bg-opacity-20 text-theme-accent-success rounded text-xs font-medium">Operational</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-theme-text-secondary">Active Projects:</span>
                                            <span className="font-medium text-theme-text-primary">3</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-theme-text-secondary">Background Tasks:</span>
                                            <span className="font-medium text-theme-text-primary">2</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-theme-text-secondary">Theme:</span>
                                            <span className="font-medium text-theme-text-primary capitalize">{theme}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-theme-text-secondary">Last Updated:</span>
                                            <span className="font-medium text-theme-text-primary">Just now</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === TAB_AAS && (
                                <div className="flex flex-col h-full">
                                    <div className="flex-1 p-4 space-y-3 min-h-0 overflow-auto">
                                        <div className="text-xs text-theme-text-muted mb-2">Assistant ready to help with DADMS tasks</div>

                                        {/* Sample assistant message */}
                                        <div className="bg-theme-accent-primary bg-opacity-10 border border-theme-accent-primary border-opacity-30 rounded-lg p-3">
                                            <div className="flex items-start gap-2">
                                                <div className="w-5 h-5 bg-theme-accent-primary rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <Icon name="robot" size="sm" className="text-white" />
                                                </div>
                                                <div className="text-xs text-theme-text-primary leading-relaxed">
                                                    I&apos;m monitoring your DADMS workspace. I noticed you have 3 active projects.
                                                    Would you like me to help prioritize your next steps or provide insights on any specific project?
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Input Area */}
                                    <div className="border-t border-theme-border p-3 bg-theme-bg-secondary">
                                        <div className="flex gap-2">
                                            <textarea
                                                value={aasInput}
                                                onChange={(e) => setAasInput(e.target.value)}
                                                onKeyPress={handleKeyPress}
                                                placeholder="Ask the assistant anything..."
                                                className="flex-1 bg-theme-input-bg border border-theme-input-border text-theme-text-primary placeholder-theme-text-muted rounded px-3 py-2 text-xs resize-none focus:border-theme-accent-primary focus:outline-none"
                                                rows={1}
                                                style={{
                                                    minHeight: "32px",
                                                    maxHeight: "80px"
                                                }}
                                            />
                                            <button
                                                onClick={handleAasSend}
                                                disabled={!aasInput.trim()}
                                                className="bg-theme-accent-primary text-white px-3 py-1.5 rounded text-xs font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex-shrink-0"
                                            >
                                                Send
                                            </button>
                                        </div>
                                        <div className="text-xs text-theme-text-muted mt-1">
                                            Press Enter to send, Shift+Enter for new line
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        );
    }

    // Floating mode (existing behavior)
    const displayHeight = isMinimized ? 48 : height;

    return (
        <div
            className={`fixed border border-theme-border z-40 flex flex-col overflow-hidden bg-theme-surface ${isDragging ? 'shadow-2xl' : 'shadow-lg'}`}
            style={{
                left: position.x + 'px',
                top: position.y + 'px',
                width: '400px',
                height: displayHeight + 'px',
                borderRadius: '6px',
                transition: isMinimized ? 'height 0.3s ease' : isDragging ? 'none' : 'box-shadow 0.2s ease'
            }}
        >
            {/* Resize Handle */}
            {!isMinimized && (
                <div
                    ref={dragRef}
                    onMouseDown={handleResizeDragStart}
                    className="h-1 bg-theme-border hover:bg-theme-accent-primary cursor-ns-resize transition-colors relative group"
                    title="Drag to resize"
                >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-8 h-0.5 bg-theme-text-muted rounded"></div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div
                ref={headerRef}
                onMouseDown={handlePositionDragStart}
                onContextMenu={(e) => {
                    e.preventDefault();
                    resetPosition();
                }}
                className={`px-3 py-2 flex items-center justify-between ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} select-none bg-theme-bg-secondary border-b border-theme-border`}
                title="Drag to move • Right-click to reset position"
            >
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 flex items-center justify-center bg-theme-accent-primary rounded-sm">
                        <Icon name="robot" size="sm" className="text-white" />
                    </div>
                    <h3 className="text-sm font-medium text-theme-text-primary">Agent Assistant</h3>
                    <div className="w-2 h-2 bg-theme-accent-success rounded-full" title="Active" />
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={openDetachedWindow}
                        className="p-1 hover:bg-theme-surface-hover rounded text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                        title="Open in separate window"
                    >
                        <Icon name="ellipsis" size="sm" />
                    </button>
                    <button
                        onClick={handleDocking}
                        className="p-1 hover:bg-theme-surface-hover rounded text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                        title="Dock to bottom"
                    >
                        <Icon name="arrow-down" size="sm" />
                    </button>
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="p-1 hover:bg-theme-surface-hover rounded text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                        title={isMinimized ? "Expand" : "Minimize"}
                    >
                        <Icon name={isMinimized ? "arrow-up" : "chevron-down"} size="sm" />
                    </button>
                    <button
                        onClick={() => setVisible(false)}
                        className="p-1 hover:bg-theme-surface-hover rounded text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                        title="Close"
                    >
                        <Icon name="close" size="sm" />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Tab Navigation */}
                    <div className="bg-theme-bg-primary border-b border-theme-border px-2">
                        <nav className="flex">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        px-3 py-2 text-xs font-medium transition-all duration-200 border-b-2 flex items-center gap-1
                                        ${activeTab === tab.id
                                            ? 'text-theme-accent-primary border-theme-accent-primary bg-theme-surface'
                                            : 'text-theme-text-secondary border-transparent hover:text-theme-accent-primary hover:border-theme-border-light'
                                        }
                                    `}
                                    title={tab.description}
                                >
                                    <Icon name={tab.icon as CodiconName} size="sm" />
                                    {tab.name}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content - same as docked mode */}
                    <div className="flex-1 overflow-auto">
                        {activeTab === TAB_ERRORS && (
                            <div className="p-4">
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 bg-theme-accent-success bg-opacity-20 rounded-lg flex items-center justify-center mx-auto mb-3">
                                        <Icon name="check" size="lg" className="text-theme-accent-success" />
                                    </div>
                                    <p className="text-sm text-theme-text-secondary">No errors detected</p>
                                    <p className="text-xs text-theme-text-muted mt-1">System running normally</p>
                                </div>
                            </div>
                        )}

                        {activeTab === TAB_INFO && (
                            <div className="p-4 space-y-3">
                                <div className="text-xs space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-theme-text-secondary">System Status:</span>
                                        <span className="px-2 py-1 bg-theme-accent-success bg-opacity-20 text-theme-accent-success rounded text-xs font-medium">Operational</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-theme-text-secondary">Active Projects:</span>
                                        <span className="font-medium text-theme-text-primary">3</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-theme-text-secondary">Background Tasks:</span>
                                        <span className="font-medium text-theme-text-primary">2</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-theme-text-secondary">Theme:</span>
                                        <span className="font-medium text-theme-text-primary capitalize">{theme}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-theme-text-secondary">Last Updated:</span>
                                        <span className="font-medium text-theme-text-primary">Just now</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === TAB_AAS && (
                            <div className="flex flex-col h-full">
                                <div className="flex-1 p-4 space-y-3 min-h-0 overflow-auto">
                                    <div className="text-xs text-theme-text-muted mb-2">Assistant ready to help with DADMS tasks</div>

                                    {/* Sample assistant message */}
                                    <div className="bg-theme-accent-primary bg-opacity-10 border border-theme-accent-primary border-opacity-30 rounded-lg p-3">
                                        <div className="flex items-start gap-2">
                                            <div className="w-5 h-5 bg-theme-accent-primary rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Icon name="robot" size="sm" className="text-white" />
                                            </div>
                                            <div className="text-xs text-theme-text-primary leading-relaxed">
                                                I&apos;m monitoring your DADMS workspace. I noticed you have 3 active projects.
                                                Would you like me to help prioritize your next steps or provide insights on any specific project?
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Input Area */}
                                <div className="border-t border-theme-border p-3 bg-theme-bg-secondary">
                                    <div className="flex gap-2">
                                        <textarea
                                            value={aasInput}
                                            onChange={(e) => setAasInput(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Ask the assistant anything..."
                                            className="flex-1 bg-theme-input-bg border border-theme-input-border text-theme-text-primary placeholder-theme-text-muted rounded px-3 py-2 text-xs resize-none focus:border-theme-accent-primary focus:outline-none"
                                            rows={1}
                                            style={{
                                                minHeight: "32px",
                                                maxHeight: "80px"
                                            }}
                                        />
                                        <button
                                            onClick={handleAasSend}
                                            disabled={!aasInput.trim()}
                                            className="bg-theme-accent-primary text-white px-3 py-1.5 rounded text-xs font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex-shrink-0"
                                        >
                                            Send
                                        </button>
                                    </div>
                                    <div className="text-xs text-theme-text-muted mt-1">
                                        Press Enter to send, Shift+Enter for new line
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
} 