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
    const {
        isDocked: contextIsDocked,
        dockedHeight: contextDockedHeight,
        dockedWidth: contextDockedWidth,
        dockPosition: contextDockPosition,
        visible: contextVisible,
        position: contextPosition,
        activeTab: contextActiveTab,
        isMinimized: contextIsMinimized,
        isDetached: contextIsDetached,
        setIsDocked: setContextIsDocked,
        setDockedHeight: setContextDockedHeight,
        setDockedWidth: setContextDockedWidth,
        setDockPosition: setContextDockPosition,
        setVisible: setContextVisible,
        setPosition: setContextPosition,
        setActiveTab: setContextActiveTab,
        setIsMinimized: setContextIsMinimized,
        setIsDetached: setContextIsDetached
    } = useAgentAssistant();

    // Add hydration state to prevent SSR/client mismatch
    const [isHydrated, setIsHydrated] = useState(false);

    // Initialize local state from context (which loads from localStorage)
    const [height, setHeight] = useState(280);
    const [width, setWidth] = useState(320);
    const [aasInput, setAasInput] = useState("");
    const [conversationHistory, setConversationHistory] = useState("Assistant: I'm monitoring your DADMS workspace. I noticed you have 3 active projects. Would you like me to help prioritize your next steps or provide insights on any specific project?\n\nAsk me anything about your DADMS workspace...");
    const conversationRef = useRef<HTMLTextAreaElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const detachedWindowRef = useRef<Window | null>(null);
    const dragRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const startY = useRef<number | null>(null);
    const startX = useRef<number | null>(null);
    const startHeight = useRef<number>(height);
    const startWidth = useRef<number>(width);
    const startPosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const startMouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const isResizing = useRef<boolean>(false);

    // Handle hydration - set initial state after client-side mount
    useEffect(() => {
        setIsHydrated(true);
        setHeight(contextDockedHeight || 280);
        setWidth(contextDockedWidth || 320);
    }, [contextDockedHeight, contextDockedWidth]);

    // Sync with context state changes (from other instances or localStorage)
    useEffect(() => {
        setHeight(contextDockedHeight || 280);
        setWidth(contextDockedWidth || 320);
    }, [contextDockedHeight, contextDockedWidth]);

    // Update context when local state changes, but avoid loops
    useEffect(() => {
        if (contextIsDocked) {
            if (contextDockPosition === 'bottom') {
                // For bottom docking, always save the actual height (not minimized height)
                if (height !== contextDockedHeight) {
                    setContextDockedHeight(height);
                }
            } else if (contextDockPosition === 'right') {
                // For right docking, always save the actual width (not minimized width)
                if (width !== contextDockedWidth) {
                    setContextDockedWidth(width);
                }
            }
        } else {
            // Only reset if not already reset
            if (contextDockedHeight !== 0) {
                setContextDockedHeight(0);
            }
            if (contextDockedWidth !== 0) {
                setContextDockedWidth(0);
            }
        }
    }, [height, width, contextIsDocked, contextDockPosition, contextDockedHeight, contextDockedWidth, setContextDockedHeight, setContextDockedWidth]);

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
            'directories=no',
            'personalbar=no',
            'titlebar=no',
            'chrome=no',
            'modal=no',
            'minimizable=no',
            'maximizable=no'
        ].join(',');

        // Try creating a blob URL to avoid about:blank
        const basicHTML = `<!DOCTYPE html>
<html>
<head>
    <title>DADMS Assistant</title>
    <style>
        html, body { 
            margin: 0; 
            padding: 0; 
            background: #1e1e1e; 
            color: #fff; 
            font-family: sans-serif; 
            height: 100vh;
            overflow: hidden;
        }
        .loading {
            padding: 20px;
            text-align: center;
            margin-top: 50px;
        }
    </style>
</head>
<body>
    <div class="loading">Loading DADMS Assistant...</div>
</body>
</html>`;

        const blob = new Blob([basicHTML], { type: 'text/html' });
        const blobURL = URL.createObjectURL(blob);

        const newWindow = window.open(blobURL, 'DADMS_Agent_Assistant', windowFeatures);

        if (!newWindow) {
            alert('Popup blocked! Please allow popups for this site to use the detached agent assistant.');
            return;
        }

        detachedWindowRef.current = newWindow;
        setContextIsDetached(true);
        setContextVisible(false);
        setContextIsDocked(false);

        // Set up the detached window content
        setupDetachedWindow(newWindow);

        // Handle window close
        newWindow.addEventListener('beforeunload', () => {
            setContextIsDetached(false);
            detachedWindowRef.current = null;
            // Clean up blob URL
            URL.revokeObjectURL(blobURL);
        });

        // Basic window setup without aggressive focus management
        try {
            newWindow.focus();
        } catch (e) {
            console.warn('Window focus may be restricted by browser security settings');
        }
    };

    const setupDetachedWindow = (win: Window) => {
        const doc = win.document;

        // Immediately replace the entire document to avoid about:blank
        doc.open();
        doc.write('<!DOCTYPE html><html><head><title>DADMS Assistant</title><style>html,body{margin:0;padding:0;background:#1e1e1e;color:#fff;font-family:sans-serif;}</style></head><body><div style="padding:20px;">Loading DADMS Assistant...</div></body></html>');
        doc.close();

        // Try to modify the URL in the address bar (may not work due to security)
        try {
            if (win.history && win.history.replaceState) {
                win.history.replaceState({}, 'DADMS Assistant', '#dadms-assistant');
            }
        } catch (e) {
            // Ignore if not allowed
        }

        // Function to get current theme variables
        const getThemeVars = (currentTheme: string) => {
            const isDarkTheme = currentTheme === 'dark';
            return isDarkTheme ? {
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
        };

        // Function to update theme in detached window
        const updateDetachedWindowTheme = (currentTheme: string) => {
            if (!win || win.closed) return;

            const themeVars = getThemeVars(currentTheme);
            const rootElement = win.document.documentElement;

            if (rootElement) {
                Object.entries(themeVars).forEach(([key, value]) => {
                    rootElement.style.setProperty(key, value);
                });
            }
        };

        // Initial theme setup
        const themeVars = getThemeVars(theme);

        // Add styles
        doc.head.innerHTML = `
            <style>
                :root {
                    ${Object.entries(themeVars).map(([key, value]) => `${key}: ${value};`).join('')}
                }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html, body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    background: var(--bg-primary); 
                    color: var(--text-primary); 
                    height: 100vh; 
                    width: 100vw;
                    overflow: hidden;
                    margin: 0;
                    padding: 0;
                    border: none;
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                }
                .container { 
                    height: 100vh; 
                    width: 100vw;
                    display: flex; 
                    flex-direction: column; 
                    border: none;
                    border-radius: 0;
                    overflow: hidden;
                    box-shadow: inset 0 0 0 2px var(--accent-primary);
                    position: relative;
                }
                .header { 
                    background: var(--bg-secondary); 
                    padding: 6px 12px; 
                    border-bottom: 1px solid var(--border); 
                    display: flex; 
                    align-items: center; 
                    justify-content: space-between;
                    cursor: move;
                    user-select: none;
                    min-height: 32px;
                    position: relative;
                    z-index: 1000;
                    background: linear-gradient(135deg, var(--bg-secondary), var(--surface));
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }
                .header h3 { 
                    font-size: 13px; 
                    font-weight: 600; 
                    color: var(--text-primary);
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .header .icon {
                    width: 16px;
                    height: 16px;
                    background: var(--accent-primary);
                    border-radius: 3px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                .header .status-dot {
                    width: 8px;
                    height: 8px;
                    background: var(--accent-success);
                    border-radius: 50%;
                    margin-left: 6px;
                }
                .close-btn { 
                    background: none; 
                    border: none; 
                    color: var(--text-secondary); 
                    cursor: pointer; 
                    padding: 4px 8px; 
                    border-radius: 2px; 
                    font-size: 14px;
                    font-weight: bold;
                    min-width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .close-btn:hover { 
                    background: #ff4444; 
                    color: white;
                }
                .tabs { 
                    display: flex; 
                    background: var(--surface); 
                    border-bottom: 1px solid var(--border); 
                }
                .tab { 
                    padding: 12px 16px; 
                    cursor: pointer; 
                    border-right: 1px solid var(--border); 
                    font-size: 12px;
                    color: var(--text-secondary);
                    user-select: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 40px;
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
                .tab-icon {
                    display: inline-block;
                    width: 16px;
                    height: 16px;
                    line-height: 16px;
                    text-align: center;
                    font-size: 14px;
                    font-weight: normal;
                }
                .tab-icon[data-icon="robot"]::before { content: "◇"; }
                .tab-icon[data-icon="warning"]::before { content: "△"; }
                .tab-icon[data-icon="info"]::before { content: "○"; }
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
                    border-radius: 4px; 
                    font-family: inherit;
                    resize: none;
                    font-size: 12px;
                }
                .input-box:focus { 
                    outline: none; 
                    border-color: var(--accent-primary); 
                    box-shadow: 0 0 0 2px var(--accent-primary)20;
                }
                .send-btn { 
                    background: var(--accent-primary); 
                    border: none; 
                    color: white; 
                    padding: 6px 12px; 
                    margin-top: 4px; 
                    border-radius: 4px; 
                    cursor: pointer; 
                    font-size: 12px;
                    font-weight: 500;
                }
                .send-btn:hover { 
                    opacity: 0.9; 
                }
                .send-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .message { 
                    margin-bottom: 8px; 
                    padding: 8px; 
                    border-radius: 6px; 
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
                <div class="header" onmousedown="startDrag(event)">
                    <h3>
                        <span class="icon"></span>
                        DADMS Agent Assistant
                        <span class="status-dot" title="Connected"></span>
                    </h3>
                    <button class="close-btn" onclick="window.close()" title="Close Assistant">×</button>
                </div>
                <div class="tabs">
                    <div class="tab active" data-tab="assistant" title="Assistant">
                        <span class="tab-icon" data-icon="robot"></span>
                    </div>
                    <div class="tab" data-tab="errors" title="Errors">
                        <span class="tab-icon" data-icon="warning"></span>
                    </div>
                    <div class="tab" data-tab="info" title="Info">
                        <span class="tab-icon" data-icon="info"></span>
                    </div>
                </div>
                <div class="content" id="content">
                    <div class="message assistant-message">
                        <strong>DADMS Agent Assistant:</strong> I'm your AI assistant running in a separate window. 
                        I can help you with decision analysis, process management, and system navigation.
                        <br><br>
                        <strong>Benefits of detached mode:</strong><br>
                        • Takes no space in your main browser<br>
                        • Independent window you can position anywhere<br>
                        • Persistent across browser tabs<br>
                        • Follows your UI theme automatically<br>
                        • Drag the header to move this window
                    </div>
                </div>
                <div class="input-area">
                    <textarea class="input-box" id="messageInput" placeholder="Ask me anything about DADMS..." rows="2"></textarea>
                    <button class="send-btn" id="sendButton" onclick="sendMessage()" disabled>Send</button>
                </div>
            </div>
        `;

        // Add JavaScript functionality
        const script = doc.createElement('script');
        script.textContent = `
            let activeTab = 'assistant';
            let isDragging = false;
            let dragOffset = { x: 0, y: 0 };
            
            // Basic window management
            window.addEventListener('focus', function() {
                const container = document.querySelector('.container');
                if (container) {
                    container.style.boxShadow = 'inset 0 0 0 2px var(--accent-primary)';
                }
            });
            
            window.addEventListener('blur', function() {
                const container = document.querySelector('.container');
                if (container) {
                    container.style.boxShadow = 'inset 0 0 0 1px var(--border)';
                }
            });
            
            // Window dragging functionality
            function startDrag(e) {
                isDragging = true;
                dragOffset.x = e.clientX;
                dragOffset.y = e.clientY;
                document.addEventListener('mousemove', doDrag);
                document.addEventListener('mouseup', stopDrag);
                e.preventDefault();
            }
            
            function doDrag(e) {
                if (!isDragging) return;
                
                const deltaX = e.clientX - dragOffset.x;
                const deltaY = e.clientY - dragOffset.y;
                
                window.moveBy(deltaX, deltaY);
                
                dragOffset.x = e.clientX;
                dragOffset.y = e.clientY;
            }
            
            function stopDrag() {
                isDragging = false;
                document.removeEventListener('mousemove', doDrag);
                document.removeEventListener('mouseup', stopDrag);
            }
            
            // Update send button state
            function updateSendButton() {
                const input = document.getElementById('messageInput');
                const button = document.getElementById('sendButton');
                button.disabled = !input.value.trim();
            }
            
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
                updateSendButton();
                content.scrollTop = content.scrollHeight;
            }
            
            // Handle input changes
            document.getElementById('messageInput').addEventListener('input', updateSendButton);
            
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
                        content.innerHTML = '<div class="message assistant-message"><strong>System Status:</strong><br>• No errors detected<br>• All services running normally<br>• Last check: ' + new Date().toLocaleTimeString() + '<br>• Theme: ${theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>';
                    } else if (tabType === 'info') {
                        content.innerHTML = '<div class="message assistant-message"><strong>DADMS Information:</strong><br>• Version: 2.0.0-alpha.2<br>• Mode: Development<br>• UI Theme: ${theme === 'dark' ? 'Dark Mode' : 'Light Mode'}<br>• Agent Assistant: Detached Mode</div>';
                    } else {
                        content.innerHTML = '<div class="message assistant-message"><strong>DADMS Agent Assistant:</strong> I\\'m your AI assistant running in a separate window. I can help you with decision analysis, process management, and system navigation.<br><br><strong>Benefits of detached mode:</strong><br>• Takes no space in your main browser<br>• Independent window you can position anywhere<br>• Persistent across browser tabs<br>• Follows your UI theme automatically<br>• Drag the header to move this window</div>';
                    }
                });
            });
            
            // Listen for theme changes from parent window
            window.addEventListener('message', function(event) {
                if (event.data && event.data.type === 'themeChange') {
                    updateDetachedWindowTheme(event.data.theme);
                }
            });
            
            // Prevent context menu
            document.addEventListener('contextmenu', function(e) {
                e.preventDefault();
            });
            
            // Initial setup
            updateSendButton();
        `;
        doc.head.appendChild(script);

        // Store the theme update function reference for later use
        (win as Window & { updateDetachedWindowTheme?: (theme: string) => void }).updateDetachedWindowTheme = updateDetachedWindowTheme;

        // Focus the window
        win.focus();
    };

    const handleDocking = () => {
        if (contextIsDocked) {
            // If already docked, switch position
            const newPosition = contextDockPosition === 'bottom' ? 'right' : 'bottom';
            setContextDockPosition(newPosition);
        } else {
            // If not docked, dock to bottom by default
            setContextIsDocked(true);
            setContextDockPosition('bottom');
        }
        setContextVisible(true);
        setContextIsDetached(false);
    };

    const handleResizeDragStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (contextDockPosition === 'bottom') {
            // Vertical resize for bottom docking
            startY.current = e.clientY;
            startHeight.current = height;
            document.body.style.cursor = "ns-resize";
        } else {
            // Horizontal resize for right docking
            startX.current = e.clientX;
            startWidth.current = width;
            document.body.style.cursor = "ew-resize";
        }

        document.body.style.userSelect = "none";

        const handleDragMove = (e: MouseEvent) => {
            if (contextDockPosition === 'bottom' && startY.current !== null) {
                const deltaY = startY.current - e.clientY;
                const newHeight = Math.max(120, Math.min(600, startHeight.current + deltaY));
                setHeight(newHeight);
            } else if (contextDockPosition === 'right' && startX.current !== null) {
                const deltaX = startX.current - e.clientX;
                const newWidth = Math.max(200, Math.min(500, startWidth.current + deltaX));
                setWidth(newWidth);
            }
        };

        const handleDragEnd = () => {
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            startY.current = null;
            startX.current = null;
            window.removeEventListener("mousemove", handleDragMove);
            window.removeEventListener("mouseup", handleDragEnd);
        };

        window.addEventListener("mousemove", handleDragMove);
        window.addEventListener("mouseup", handleDragEnd);
    };

    const handlePositionDragStart = (e: React.MouseEvent) => {
        if (contextIsDocked) return; // Don't allow dragging when docked

        e.preventDefault();
        setIsDragging(true);
        startMouse.current = { x: e.clientX, y: e.clientY };
        startPosition.current = { x: contextPosition.x, y: contextPosition.y };
        document.body.style.cursor = "grabbing";
        document.body.style.userSelect = "none";

        const handleDragMove = (e: MouseEvent) => {
            const deltaX = e.clientX - startMouse.current.x;
            const deltaY = e.clientY - startMouse.current.y;

            const newX = startPosition.current.x + deltaX;
            const newY = startPosition.current.y + deltaY;

            setContextPosition({ x: newX, y: newY });
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
    }, [height, contextIsMinimized]);

    // Monitor detached window status and theme changes
    useEffect(() => {
        if (!contextIsDetached || !detachedWindowRef.current) return;

        const checkWindowStatus = () => {
            if (detachedWindowRef.current && detachedWindowRef.current.closed) {
                setContextIsDetached(false);
                detachedWindowRef.current = null;
            }
        };

        const interval = setInterval(checkWindowStatus, 1000);
        return () => clearInterval(interval);
    }, [contextIsDetached]);

    // Update detached window theme when theme changes
    useEffect(() => {
        if (!contextIsDetached || !detachedWindowRef.current || detachedWindowRef.current.closed) return;

        try {
            // Send theme change message to detached window
            detachedWindowRef.current.postMessage({ type: 'themeChange', theme: theme }, '*');
        } catch (e) {
            console.warn('Could not send theme change to detached window:', e);
        }
    }, [theme, contextIsDetached]);

    const handleAasSend = () => {
        if (aasInput.trim()) {
            // Add user message to conversation
            const userMessage = `You: ${aasInput}`;
            const assistantResponse = `Assistant: I received your message: "${aasInput}". In a full implementation, I would provide intelligent responses and can execute actions in the main DADMS interface.`;

            setConversationHistory(prev =>
                prev + `\n\n${userMessage}\n\n${assistantResponse}`
            );
            setAasInput("");

            // Auto-scroll to bottom after a short delay
            setTimeout(() => {
                if (conversationRef.current) {
                    conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
                }
            }, 100);
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
            const statusBarHeight = 24;
            setContextPosition({
                x: Math.max(20, window.innerWidth - 420),
                y: Math.max(20, window.innerHeight - 300 - statusBarHeight)
            });
        }
    };

    // Don't render anything until hydrated to prevent SSR/client mismatch
    if (!isHydrated) {
        return null;
    }

    // Show control buttons when not visible
    if (!contextVisible && !contextIsDetached && !contextIsDocked) {
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
                    onClick={() => setContextVisible(true)}
                    onDoubleClick={() => {
                        setContextVisible(true);
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
    if (contextIsDetached) {
        return (
            <button
                onClick={() => {
                    if (detachedWindowRef.current && !detachedWindowRef.current.closed) {
                        detachedWindowRef.current.focus();
                    } else {
                        setContextIsDetached(false);
                        setContextVisible(true);
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

    // Docked mode - appears above the status bar (bottom) or to the right of content (right)
    if (contextIsDocked) {
        const displayHeight = contextIsMinimized ? 48 : height;
        const displayWidth = contextIsMinimized ? 48 : width;
        const statusBarHeight = 24; // VSCode status bar height from CSS

        if (contextDockPosition === 'bottom') {
            return (
                <div
                    className="fixed left-0 right-0 z-40 flex flex-col overflow-hidden border-t border-theme-border bg-theme-surface"
                    style={{
                        bottom: statusBarHeight + 'px',
                        height: displayHeight + 'px',
                        transition: contextIsMinimized ? 'height 0.3s ease' : 'none'
                    }}
                >
                    {/* Resize Handle with Controls */}
                    {!contextIsMinimized && (
                        <div className="h-6 bg-theme-bg-secondary border-b border-theme-border flex items-center justify-between px-2 select-none">
                            {/* Left side - Resize handle */}
                            <div
                                onMouseDown={handleResizeDragStart}
                                className="flex-1 h-full flex items-center justify-center cursor-ns-resize hover:bg-theme-surface-hover transition-colors group"
                                title="Drag to resize"
                            >
                                <div className="w-8 h-0.5 bg-theme-text-muted rounded group-hover:bg-theme-accent-primary transition-colors"></div>
                            </div>

                            {/* Right side - Control buttons */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setContextIsMinimized(!contextIsMinimized)}
                                    className="p-0.5 hover:bg-theme-surface-hover rounded text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                                    title={contextIsMinimized ? "Expand" : "Minimize"}
                                >
                                    <Icon name={contextIsMinimized ? "arrow-up" : "chevron-down"} size="xs" />
                                </button>
                                <button
                                    onClick={openDetachedWindow}
                                    className="p-0.5 hover:bg-theme-surface-hover rounded text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                                    title="Open in separate window"
                                >
                                    <Icon name="ellipsis" size="xs" />
                                </button>
                                <button
                                    onClick={handleDocking}
                                    className="p-0.5 hover:bg-theme-surface-hover rounded text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                                    title="Switch to right dock"
                                >
                                    <Icon name="arrow-right" size="xs" />
                                </button>
                                <button
                                    onClick={() => {
                                        setContextVisible(false);
                                        setContextIsDocked(false);
                                    }}
                                    className="p-0.5 hover:bg-theme-surface-hover rounded text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                                    title="Close"
                                >
                                    <Icon name="close" size="xs" />
                                </button>
                            </div>
                        </div>
                    )}

                    {!contextIsMinimized && (
                        <>
                            {/* Tab Navigation */}
                            <div className="bg-theme-bg-primary border-b border-theme-border px-2">
                                <nav className="flex">
                                    {TABS.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setContextActiveTab(tab.id)}
                                            className={`
                                                px-3 py-3 text-xs font-medium transition-all duration-200 border-b-2 flex items-center justify-center min-w-[40px]
                                                ${contextActiveTab === tab.id
                                                    ? 'text-theme-accent-primary border-theme-accent-primary bg-theme-surface'
                                                    : 'text-theme-text-secondary border-transparent hover:text-theme-accent-primary hover:border-theme-border-light'
                                                }
                                            `}
                                            title={tab.description}
                                        >
                                            <Icon name={tab.icon as CodiconName} size="sm" />
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-auto">
                                {contextActiveTab === TAB_ERRORS && (
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

                                {contextActiveTab === TAB_INFO && (
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

                                {contextActiveTab === TAB_AAS && (
                                    <div className="flex flex-col h-full p-2 gap-2">
                                        {/* Conversation Area - fills available space */}
                                        <textarea
                                            ref={conversationRef}
                                            readOnly
                                            value={conversationHistory}
                                            className="flex-1 bg-theme-input-bg border border-theme-input-border text-theme-text-primary rounded px-3 py-2 text-xs resize-none focus:border-theme-accent-primary focus:outline-none min-h-0"
                                            style={{
                                                fontFamily: 'inherit'
                                            }}
                                        />

                                        {/* Input Area - fixed height at bottom */}
                                        <div className="flex gap-2">
                                            <textarea
                                                value={aasInput}
                                                onChange={(e) => setAasInput(e.target.value)}
                                                onKeyPress={handleKeyPress}
                                                placeholder="Ask the assistant anything..."
                                                className="flex-1 bg-theme-input-bg border border-theme-input-border text-theme-text-primary placeholder-theme-text-muted rounded px-3 py-2 text-xs resize-none focus:border-theme-accent-primary focus:outline-none"
                                                rows={2}
                                                style={{
                                                    minHeight: "44px",
                                                    maxHeight: "80px"
                                                }}
                                            />
                                            <button
                                                onClick={handleAasSend}
                                                disabled={!aasInput.trim()}
                                                className="bg-theme-accent-primary text-white px-3 py-2 rounded text-xs font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex-shrink-0 self-end"
                                            >
                                                Send
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Minimized state */}
                    {contextIsMinimized && (
                        <div className="flex items-center justify-center h-full">
                            <button
                                onClick={() => setContextIsMinimized(false)}
                                className="p-2 hover:bg-theme-surface-hover rounded text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                                title="Expand Assistant"
                            >
                                <Icon name="robot" size="sm" />
                            </button>
                        </div>
                    )}
                </div>
            );
        } else {
            // Right docking
            const titleBarHeight = 35; // VSCode title bar height
            const statusBarHeight = 24; // VSCode status bar height

            return (
                <div
                    className="fixed z-40 flex flex-col overflow-hidden border-l border-theme-border bg-theme-surface"
                    style={{
                        right: 0,
                        top: titleBarHeight + 'px',
                        bottom: statusBarHeight + 'px',
                        width: displayWidth + 'px',
                        transition: contextIsMinimized ? 'width 0.3s ease' : 'none'
                    }}
                >
                    {/* Left-side Resize Handle for Right Docking */}
                    {!contextIsMinimized && (
                        <div
                            onMouseDown={handleResizeDragStart}
                            className="agent-resize-handle"
                            title="Drag to resize width"
                        >
                            {/* Visual indicator */}
                            <div className="resize-indicator" />
                        </div>
                    )}

                    {/* Resize Handle with Controls */}
                    {!contextIsMinimized && (
                        <div className="h-6 bg-theme-bg-secondary border-b border-theme-border flex items-center justify-between px-2 select-none">
                            {/* Left side - Title/Info */}
                            <div className="flex items-center gap-2 text-xs text-theme-text-secondary">
                                <Icon name="robot" size="xs" />
                                <span>Assistant</span>
                            </div>

                            {/* Right side - Control buttons */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setContextIsMinimized(!contextIsMinimized)}
                                    className="p-0.5 hover:bg-theme-surface-hover rounded text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                                    title={contextIsMinimized ? "Expand" : "Minimize"}
                                >
                                    <Icon name={contextIsMinimized ? "arrow-right" : "chevron-right"} size="xs" />
                                </button>
                                <button
                                    onClick={openDetachedWindow}
                                    className="p-0.5 hover:bg-theme-surface-hover rounded text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                                    title="Open in separate window"
                                >
                                    <Icon name="ellipsis" size="xs" />
                                </button>
                                <button
                                    onClick={handleDocking}
                                    className="p-0.5 hover:bg-theme-surface-hover rounded text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                                    title="Switch to bottom dock"
                                >
                                    <Icon name="arrow-down" size="xs" />
                                </button>
                                <button
                                    onClick={() => {
                                        setContextVisible(false);
                                        setContextIsDocked(false);
                                    }}
                                    className="p-0.5 hover:bg-theme-surface-hover rounded text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                                    title="Close"
                                >
                                    <Icon name="close" size="xs" />
                                </button>
                            </div>
                        </div>
                    )}

                    {!contextIsMinimized && (
                        <>
                            {/* Tab Navigation */}
                            <div className="bg-theme-bg-primary border-b border-theme-border px-2">
                                <nav className="flex">
                                    {TABS.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setContextActiveTab(tab.id)}
                                            className={`
                                                px-3 py-3 text-xs font-medium transition-all duration-200 border-b-2 flex items-center justify-center min-w-[40px]
                                                ${contextActiveTab === tab.id
                                                    ? 'text-theme-accent-primary border-theme-accent-primary bg-theme-surface'
                                                    : 'text-theme-text-secondary border-transparent hover:text-theme-accent-primary hover:border-theme-border-light'
                                                }
                                            `}
                                            title={tab.description}
                                        >
                                            <Icon name={tab.icon as CodiconName} size="sm" />
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-auto">
                                {contextActiveTab === TAB_ERRORS && (
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

                                {contextActiveTab === TAB_INFO && (
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

                                {contextActiveTab === TAB_AAS && (
                                    <div className="flex flex-col h-full p-2 gap-2">
                                        {/* Conversation Area - fills available space */}
                                        <textarea
                                            ref={conversationRef}
                                            readOnly
                                            value={conversationHistory}
                                            className="flex-1 bg-theme-input-bg border border-theme-input-border text-theme-text-primary rounded px-3 py-2 text-xs resize-none focus:border-theme-accent-primary focus:outline-none min-h-0"
                                            style={{
                                                fontFamily: 'inherit'
                                            }}
                                        />

                                        {/* Input Area - fixed height at bottom */}
                                        <div className="flex gap-2">
                                            <textarea
                                                value={aasInput}
                                                onChange={(e) => setAasInput(e.target.value)}
                                                onKeyPress={handleKeyPress}
                                                placeholder="Ask the assistant anything..."
                                                className="flex-1 bg-theme-input-bg border border-theme-input-border text-theme-text-primary placeholder-theme-text-muted rounded px-3 py-2 text-xs resize-none focus:border-theme-accent-primary focus:outline-none"
                                                rows={2}
                                                style={{
                                                    minHeight: "44px",
                                                    maxHeight: "80px"
                                                }}
                                            />
                                            <button
                                                onClick={handleAasSend}
                                                disabled={!aasInput.trim()}
                                                className="bg-theme-accent-primary text-white px-3 py-2 rounded text-xs font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex-shrink-0 self-end"
                                            >
                                                Send
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Minimized state */}
                    {contextIsMinimized && (
                        <div className="flex items-center justify-center h-full">
                            <button
                                onClick={() => setContextIsMinimized(false)}
                                className="p-2 hover:bg-theme-surface-hover rounded text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                                title="Expand Assistant"
                            >
                                <Icon name="robot" size="sm" />
                            </button>
                        </div>
                    )}
                </div>
            );
        }
    }

    // Floating mode (existing behavior)
    const displayHeight = contextIsMinimized ? 48 : height;

    return (
        <div
            className={`fixed border border-theme-border z-40 flex flex-col overflow-hidden bg-theme-surface ${isDragging ? 'shadow-2xl' : 'shadow-lg'}`}
            style={{
                left: contextPosition.x + 'px',
                top: contextPosition.y + 'px',
                width: '400px',
                height: displayHeight + 'px',
                borderRadius: '6px',
                transition: contextIsMinimized ? 'height 0.3s ease' : isDragging ? 'none' : 'box-shadow 0.2s ease'
            }}
        >
            {/* Resize Handle */}
            {!contextIsMinimized && (
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
                        onClick={() => setContextIsMinimized(!contextIsMinimized)}
                        className="p-1 hover:bg-theme-surface-hover rounded text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                        title={contextIsMinimized ? "Expand" : "Minimize"}
                    >
                        <Icon name={contextIsMinimized ? "arrow-up" : "chevron-down"} size="sm" />
                    </button>
                    <button
                        onClick={() => setContextVisible(false)}
                        className="p-1 hover:bg-theme-surface-hover rounded text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                        title="Close"
                    >
                        <Icon name="close" size="sm" />
                    </button>
                </div>
            </div>

            {!contextIsMinimized && (
                <>
                    {/* Tab Navigation */}
                    <div className="bg-theme-bg-primary border-b border-theme-border px-2">
                        <nav className="flex">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setContextActiveTab(tab.id)}
                                    className={`
                                        px-3 py-2 text-xs font-medium transition-all duration-200 border-b-2 flex items-center gap-1
                                        ${contextActiveTab === tab.id
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
                        {contextActiveTab === TAB_ERRORS && (
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

                        {contextActiveTab === TAB_INFO && (
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

                        {contextActiveTab === TAB_AAS && (
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