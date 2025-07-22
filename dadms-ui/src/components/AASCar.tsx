"use client";

import React, { useEffect, useRef, useState } from "react";

const TAB_ERRORS = "errors";
const TAB_INFO = "info";
const TAB_AAS = "assistant";

const TABS = [
    { id: TAB_ERRORS, name: "Errors", icon: "⚠️", description: "System issues" },
    { id: TAB_INFO, name: "Info", icon: "ℹ️", description: "System status" },
    { id: TAB_AAS, name: "Assistant", icon: "🤖", description: "AI assistance" },
];

export default function AASCar() {
    const [visible, setVisible] = useState(true);
    const [height, setHeight] = useState(280);
    // Use safe initial values for SSR
    const [position, setPosition] = useState({ x: 400, y: 100 });
    const [activeTab, setActiveTab] = useState(TAB_AAS);
    const [aasInput, setAasInput] = useState("");
    const [isMinimized, setIsMinimized] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isDetached, setIsDetached] = useState(false);
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

        // Add styles
        doc.head.innerHTML = `
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    background: #1e1e1e; 
                    color: #cccccc; 
                    height: 100vh; 
                    overflow: hidden;
                }
                .container { 
                    height: 100vh; 
                    display: flex; 
                    flex-direction: column; 
                    border: 1px solid #2d2d30;
                }
                .header { 
                    background: #252526; 
                    padding: 8px 12px; 
                    border-bottom: 1px solid #2d2d30; 
                    display: flex; 
                    align-items: center; 
                    justify-content: space-between;
                    cursor: move;
                }
                .header h3 { 
                    font-size: 13px; 
                    font-weight: 600; 
                }
                .close-btn { 
                    background: none; 
                    border: none; 
                    color: #cccccc; 
                    cursor: pointer; 
                    padding: 4px 8px; 
                    border-radius: 2px; 
                }
                .close-btn:hover { 
                    background: #3e3e42; 
                }
                .tabs { 
                    display: flex; 
                    background: #2d2d30; 
                    border-bottom: 1px solid #2d2d30; 
                }
                .tab { 
                    padding: 8px 16px; 
                    cursor: pointer; 
                    border-right: 1px solid #2d2d30; 
                    font-size: 12px;
                }
                .tab:hover { 
                    background: #3e3e42; 
                }
                .tab.active { 
                    background: #1e1e1e; 
                    border-bottom: 2px solid #007acc; 
                }
                .content { 
                    flex: 1; 
                    padding: 12px; 
                    overflow-y: auto; 
                }
                .input-area { 
                    border-top: 1px solid #2d2d30; 
                    padding: 8px; 
                    background: #252526;
                }
                .input-box { 
                    width: 100%; 
                    background: #3c3c3c; 
                    border: 1px solid #2d2d30; 
                    color: #cccccc; 
                    padding: 8px; 
                    border-radius: 2px; 
                    font-family: inherit;
                    resize: none;
                }
                .input-box:focus { 
                    outline: none; 
                    border-color: #007acc; 
                }
                .send-btn { 
                    background: #007acc; 
                    border: none; 
                    color: white; 
                    padding: 4px 12px; 
                    margin-top: 4px; 
                    border-radius: 2px; 
                    cursor: pointer; 
                    font-size: 12px;
                }
                .send-btn:hover { 
                    background: #106ebe; 
                }
                .message { 
                    margin-bottom: 8px; 
                    padding: 6px; 
                    border-radius: 2px; 
                    font-size: 12px; 
                    line-height: 1.4;
                }
                .assistant-message { 
                    background: #2d2d30; 
                    border-left: 3px solid #007acc; 
                }
                .user-message { 
                    background: #3e3e42; 
                    border-left: 3px solid #4ec9b0; 
                }
            </style>
        `;

        // Add content
        doc.body.innerHTML = `
            <div class="container">
                <div class="header">
                    <h3>🤖 DADMS Agent Assistant</h3>
                    <button class="close-btn" onclick="window.close()">×</button>
                </div>
                <div class="tabs">
                    <div class="tab active" data-tab="assistant">Assistant</div>
                    <div class="tab" data-tab="errors">Errors</div>
                    <div class="tab" data-tab="info">Info</div>
                </div>
                <div class="content" id="content">
                    <div class="message assistant-message">
                        👋 Hello! I'm your DADMS Agent Assistant running in a separate window. 
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
                        content.innerHTML = '<div class="message assistant-message">📊 <strong>System Status:</strong><br>• No errors detected<br>• All services running normally<br>• Last check: ' + new Date().toLocaleTimeString() + '</div>';
                    } else if (tabType === 'info') {
                        content.innerHTML = '<div class="message assistant-message">ℹ️ <strong>DADMS Information:</strong><br>• Version: 2.0.0-alpha.2<br>• Mode: Development<br>• UI Theme: VSCode Dark<br>• Agent Assistant: Detached Mode</div>';
                    } else {
                        content.innerHTML = '<div class="message assistant-message">👋 Hello! I\\'m your DADMS Agent Assistant running in a separate window. I can help you with decision analysis, process management, and system navigation.<br><br><strong>Benefits of detached mode:</strong><br>• Takes no space in your main browser<br>• Always visible while you work<br>• Can be positioned anywhere on your desktop<br>• Persistent across browser tabs</div>';
                    }
                });
            });
        `;
        doc.head.appendChild(script);

        // Focus the window
        win.focus();
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
        e.preventDefault();
        setIsDragging(true);
        startMouse.current = { x: e.clientX, y: e.clientY };
        startPosition.current = { x: position.x, y: position.y };
        document.body.style.cursor = "grabbing";
        document.body.style.userSelect = "none";

        const handleDragMove = (e: MouseEvent) => {
            const deltaX = e.clientX - startMouse.current.x;
            const deltaY = e.clientY - startMouse.current.y;

            // Allow dragging anywhere, including outside the browser window
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

    // Handle window resize - keep component position unchanged (allow off-screen positioning)
    useEffect(() => {
        const handleResize = () => {
            // Component position remains unchanged during window resize
            // This allows the agent assistant to stay wherever the user positioned it
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

    if (!visible && !isDetached) {
        return (
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                <button
                    onClick={openDetachedWindow}
                    className="btn-secondary shadow-lg"
                    style={{ borderRadius: '3px', fontSize: '12px', padding: '6px 12px' }}
                    title="Open Agent Assistant in separate window"
                >
                    ⧉ Detach Assistant
                </button>
                <button
                    onClick={() => setVisible(true)}
                    onDoubleClick={() => {
                        setVisible(true);
                        resetPosition();
                    }}
                    className="btn-primary shadow-lg"
                    style={{ borderRadius: '3px' }}
                    title="Show Agent Assistant (Double-click to reset position)"
                >
                    ◉ Assistant
                </button>
            </div>
        );
    }

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
                className="fixed bottom-4 right-4 btn-secondary shadow-lg z-50"
                style={{ borderRadius: '3px', fontSize: '12px', padding: '6px 12px' }}
                title="Agent Assistant is detached (Click to focus or restore)"
            >
                ⧉ Assistant (Detached)
            </button>
        );
    }

    const displayHeight = isMinimized ? 48 : height;

    return (
        <div
            className={`fixed border z-40 flex flex-col overflow-hidden ${isDragging ? 'shadow-2xl' : 'shadow-lg'}`}
            style={{
                left: position.x + 'px',
                top: position.y + 'px',
                width: '400px',
                height: displayHeight + 'px',
                backgroundColor: '#252526',
                borderColor: '#2d2d30',
                borderRadius: '3px',
                transition: isMinimized ? 'height 0.3s ease' : isDragging ? 'none' : 'box-shadow 0.2s ease'
            }}
        >
            {/* Resize Handle */}
            {!isMinimized && (
                <div
                    ref={dragRef}
                    onMouseDown={handleResizeDragStart}
                    className="h-1 bg-gray-200 hover:bg-blue-400 cursor-ns-resize transition-colors relative group"
                    title="Drag to resize"
                >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-8 h-0.5 bg-gray-400 rounded"></div>
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
                className={`px-3 py-2 flex items-center justify-between ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} select-none`}
                style={{
                    backgroundColor: '#333333',
                    borderBottom: '1px solid #2d2d30',
                    color: '#d4d4d4'
                }}
                title="Drag to move • Right-click to reset position"
            >
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 flex items-center justify-center" style={{ backgroundColor: '#007acc', borderRadius: '2px' }}>
                        <span className="text-white text-xs">A</span>
                    </div>
                    <h3 className="text-sm">Agent Assistant</h3>
                    <span className="status-indicator status-active" />
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={openDetachedWindow}
                        className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700 transition-colors"
                        title="Open in separate window"
                    >
                        ⧉
                    </button>
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700 transition-colors"
                        title={isMinimized ? "Expand" : "Minimize"}
                    >
                        {isMinimized ? "▲" : "▼"}
                    </button>
                    <button
                        onClick={() => setVisible(false)}
                        className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700 transition-colors"
                        title="Close"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Tab Navigation */}
                    <div className="bg-gray-50 border-b border-gray-200 px-2">
                        <nav className="flex">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        px-3 py-2 text-xs font-medium transition-all duration-200 border-b-2
                                        ${activeTab === tab.id
                                            ? 'text-blue-700 border-blue-700 bg-white'
                                            : 'text-gray-600 border-transparent hover:text-blue-600 hover:border-gray-300'
                                        }
                                    `}
                                    title={tab.description}
                                >
                                    <span className="mr-1">{tab.icon}</span>
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
                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                        ✅
                                    </div>
                                    <p className="text-sm text-gray-600">No errors detected</p>
                                    <p className="text-xs text-gray-500 mt-1">System running normally</p>
                                </div>
                            </div>
                        )}

                        {activeTab === TAB_INFO && (
                            <div className="p-4 space-y-3">
                                <div className="text-xs space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">System Status:</span>
                                        <span className="badge badge-success">Operational</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Active Projects:</span>
                                        <span className="font-medium text-gray-900">3</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Background Tasks:</span>
                                        <span className="font-medium text-gray-900">2</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Last Updated:</span>
                                        <span className="font-medium text-gray-900">Just now</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === TAB_AAS && (
                            <div className="flex flex-col h-full">
                                <div className="flex-1 p-4 space-y-3 min-h-0 overflow-auto">
                                    <div className="text-xs text-gray-500 mb-2">Assistant ready to help with DADMS tasks</div>

                                    {/* Sample assistant message */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <div className="flex items-start gap-2">
                                            <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <span className="text-white text-xs">A</span>
                                            </div>
                                            <div className="text-xs text-blue-800 leading-relaxed">
                                                I&apos;m monitoring your DADMS workspace. I noticed you have 3 active projects.
                                                Would you like me to help prioritize your next steps or provide insights on any specific project?
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Input Area */}
                                <div className="border-t border-gray-200 p-3">
                                    <div className="flex gap-2">
                                        <textarea
                                            value={aasInput}
                                            onChange={(e) => setAasInput(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Ask the assistant anything..."
                                            className="flex-1 input text-xs resize-none"
                                            rows={1}
                                            style={{
                                                minHeight: "32px",
                                                maxHeight: "80px"
                                            }}
                                        />
                                        <button
                                            onClick={handleAasSend}
                                            disabled={!aasInput.trim()}
                                            className="btn-primary text-xs px-3 py-1.5 flex-shrink-0"
                                        >
                                            Send
                                        </button>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
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