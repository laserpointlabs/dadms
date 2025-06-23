import React, { useEffect, useRef, useState } from 'react';
import './BPMNChat.css';

interface Message {
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    bpmn_xml?: string;
    confidence_score?: number;
    validation_errors?: string[];
}

interface BPMNResponse {
    bpmn_xml?: string;
    bpmn?: string;
    name?: string;
    description?: string;
    version?: string;
    author?: string;
    created?: string;
    tags?: string[];
    explanation: string;
    elements_created: string[];
    suggestions: string[];
    confidence_score: number;
    validation_errors: string[];
}

interface BPMNChatProps {
    onBPMNUpdate?: (bpmnXml: string) => void;
    currentBPMN?: string;
    onAIModelGenerated?: () => void;
}

// Storage keys for persistence
const STORAGE_KEYS = {
    CONVERSATION_HISTORY: 'bpmnChatHistory',
    LAST_CONVERSATION_TIME: 'bpmnChatLastTime'
};

// Helper functions for conversation persistence
const saveConversationHistory = (messages: Message[]) => {
    try {
        const serializedMessages = messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp.toISOString()
        }));
        sessionStorage.setItem(STORAGE_KEYS.CONVERSATION_HISTORY, JSON.stringify(serializedMessages));
        sessionStorage.setItem(STORAGE_KEYS.LAST_CONVERSATION_TIME, new Date().toISOString());
    } catch (error) {
        console.error('Error saving conversation history:', error);
    }
};

const loadConversationHistory = (): Message[] => {
    try {
        const saved = sessionStorage.getItem(STORAGE_KEYS.CONVERSATION_HISTORY);
        if (saved) {
            const parsedMessages = JSON.parse(saved);
            return parsedMessages.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
            }));
        }
    } catch (error) {
        console.error('Error loading conversation history:', error);
    }
    return [];
};

const clearConversationHistory = () => {
    try {
        sessionStorage.removeItem(STORAGE_KEYS.CONVERSATION_HISTORY);
        sessionStorage.removeItem(STORAGE_KEYS.LAST_CONVERSATION_TIME);
    } catch (error) {
        console.error('Error clearing conversation history:', error);
    }
};

const BPMNChat: React.FC<BPMNChatProps> = ({ onBPMNUpdate, currentBPMN, onAIModelGenerated }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [lastActiveTime, setLastActiveTime] = useState<Date | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Suggested prompts for users
    const SUGGESTED_PROMPTS = [
        "Create a simple approval process",
        "Add a decision point after review",
        "Make the approval step parallel",
        "Add error handling for rejections",
        "Create a purchase order process",
        "Add a timer event to the process"
    ];

    useEffect(() => {
        // Check service health on component mount
        checkServiceHealth();

        // Load conversation history from sessionStorage
        const savedMessages = loadConversationHistory();

        if (savedMessages.length > 0) {
            // Restore conversation history
            setMessages(savedMessages);
            console.log(`Restored ${savedMessages.length} messages from conversation history`);

            // Load last active time
            const lastTimeSaved = sessionStorage.getItem(STORAGE_KEYS.LAST_CONVERSATION_TIME);
            if (lastTimeSaved) {
                setLastActiveTime(new Date(lastTimeSaved));
            }
        } else {
            // Add welcome message for new conversation
            const welcomeMessage: Message = {
                id: Date.now().toString(),
                type: 'assistant',
                content: 'Hello! I\'m your BPMN AI assistant. I can help you create, modify, and understand BPMN process models. What would you like to work on today?',
                timestamp: new Date()
            };
            setMessages([welcomeMessage]);
        }
    }, []);

    useEffect(() => {
        // Scroll to bottom when new messages are added
        scrollToBottom();
    }, [messages]);

    // Save conversation history whenever messages change
    useEffect(() => {
        if (messages.length > 0) {
            saveConversationHistory(messages);
        }
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const checkServiceHealth = async () => {
        try {
            const response = await fetch('/api/bpmn-ai/health');
            setIsConnected(response.ok);
        } catch (error) {
            console.error('Service health check failed:', error);
            setIsConnected(false);
        }
    };

    const clearConversation = () => {
        setMessages([]);
        clearConversationHistory();

        // Add new welcome message
        const welcomeMessage: Message = {
            id: Date.now().toString(),
            type: 'assistant',
            content: 'Hello! I\'m your BPMN AI assistant. I can help you create, modify, and understand BPMN process models. What would you like to work on today?',
            timestamp: new Date()
        };
        setMessages([welcomeMessage]);
    };

    const exportConversation = () => {
        try {
            const conversationData = {
                messages: messages,
                exportedAt: new Date().toISOString(),
                version: '1.0'
            };

            const blob = new Blob([JSON.stringify(conversationData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `bpmn-conversation-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting conversation:', error);
            alert('Failed to export conversation');
        }
    };

    const importConversation = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const conversationData = JSON.parse(content);

                if (conversationData.messages && Array.isArray(conversationData.messages)) {
                    const importedMessages = conversationData.messages.map((msg: any) => ({
                        ...msg,
                        timestamp: new Date(msg.timestamp)
                    }));

                    setMessages(importedMessages);
                    saveConversationHistory(importedMessages);
                    console.log(`Imported ${importedMessages.length} messages from file`);
                } else {
                    throw new Error('Invalid conversation format');
                }
            } catch (error) {
                console.error('Error importing conversation:', error);
                alert('Failed to import conversation. Please check the file format.');
            }
        };

        reader.readAsText(file);
        event.target.value = ''; // Clear the input
    };

    const sendMessage = async (message: string) => {
        if (!message.trim() || isLoading) return;

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: message,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            let response: Response;
            let endpoint: string;
            let payload: any;

            // Get additional context about the current model
            const lastModified = sessionStorage.getItem('currentBpmnModelLastModified');
            const modelHash = sessionStorage.getItem('currentBpmnModelHash');
            const hasManualChanges = lastModified && modelHash;

            // Create enhanced context
            const enhancedContext = {
                conversation_history: messages.slice(-10), // Last 10 messages for context
                current_model: currentBPMN || null,
                current_model_summary: currentBPMN ?
                    `Existing model has ${currentBPMN.length} characters` :
                    "No existing model",
                manual_changes_info: hasManualChanges ? {
                    last_modified: lastModified,
                    model_hash: modelHash,
                    has_manual_edits: true,
                    edit_timestamp: new Date(lastModified).toLocaleString()
                } : {
                    has_manual_edits: false
                },
                user_intent: currentBPMN ? "enhance_existing_model" : "create_new_model"
            };

            // Determine if this is a generation or modification request
            if (currentBPMN && message.toLowerCase().includes('modify')) {
                endpoint = '/api/bpmn-ai/modify';
                payload = {
                    current_bpmn: currentBPMN,
                    modification_request: message,
                    context: enhancedContext
                };
            } else {
                endpoint = '/api/bpmn-ai/generate';
                payload = {
                    user_input: message,
                    context: enhancedContext
                };
            }

            console.log('Sending request to AI with context:', {
                endpoint,
                hasCurrentModel: !!currentBPMN,
                modelLength: currentBPMN?.length || 0,
                hasManualChanges: hasManualChanges,
                lastModified: lastModified
            });

            response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result: BPMNResponse = await response.json();

            // Extract BPMN XML from either 'bpmn' or 'bpmn_xml' key
            const bpmnXml = result.bpmn || result.bpmn_xml || '';

            // Extract explanation from either 'explanation' or 'description' field
            const explanation = result.explanation || result.description || 'BPMN model generated successfully.';

            // Create assistant message with BPMN result
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: explanation,
                timestamp: new Date(),
                bpmn_xml: bpmnXml,
                confidence_score: result.confidence_score,
                validation_errors: result.validation_errors
            };

            setMessages(prev => [...prev, assistantMessage]);

            // Notify parent component of BPMN update
            if (onBPMNUpdate && bpmnXml) {
                onBPMNUpdate(bpmnXml);
            }

            // Show suggestions if available
            if (result.suggestions && result.suggestions.length > 0) {
                const suggestionsMessage: Message = {
                    id: (Date.now() + 2).toString(),
                    type: 'assistant',
                    content: `💡 Suggestions: ${result.suggestions.join(', ')}`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, suggestionsMessage]);
            }

            // Show validation warnings if available
            if (result.validation_errors && result.validation_errors.length > 0) {
                const validationMessage: Message = {
                    id: (Date.now() + 3).toString(),
                    type: 'assistant',
                    content: `⚠️ BPMN Validation Issues: ${result.validation_errors.join(', ')}. The diagram may not display perfectly but is still functional.`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, validationMessage]);
            }

            // Clear manual edit tracking if a new model is generated
            if (onAIModelGenerated) {
                onAIModelGenerated();
            }

        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(inputValue);
    };

    const applySuggestedPrompt = (prompt: string) => {
        setInputValue(prompt);
    };

    const explainCurrentBPMN = async () => {
        if (!currentBPMN) {
            const message: Message = {
                id: Date.now().toString(),
                type: 'assistant',
                content: 'No BPMN model is currently loaded to explain.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, message]);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/bpmn-ai/explain', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ bpmn_xml: currentBPMN })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            const explanationMessage: Message = {
                id: Date.now().toString(),
                type: 'assistant',
                content: `📋 Current Process Explanation:\n\n${result.explanation}`,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, explanationMessage]);
        } catch (error) {
            console.error('Error explaining BPMN:', error);
            const errorMessage: Message = {
                id: Date.now().toString(),
                type: 'assistant',
                content: 'Sorry, I couldn\'t explain the current BPMN model. Please try again.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bpmn-chat">
            <div className="bpmn-chat-header">
                <div className="header-left">
                    <h3>BPMN AI Assistant</h3>
                    <div className="conversation-info">
                        <span className="message-count">{messages.length - 1} messages</span>
                        {lastActiveTime && messages.length > 1 && (
                            <span className="last-active">
                                Last active: {lastActiveTime.toLocaleDateString()} {lastActiveTime.toLocaleTimeString()}
                            </span>
                        )}
                        {messages.length > 1 && (
                            <button
                                onClick={clearConversation}
                                className="clear-conversation-btn"
                                title="Clear conversation history"
                            >
                                🗑️ Clear
                            </button>
                        )}
                    </div>
                </div>
                <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                    <span className="status-indicator"></span>
                    {isConnected ? 'Connected' : 'Disconnected'}
                </div>
            </div>

            <div className="bpmn-chat-messages">
                {messages.map((message) => (
                    <div key={message.id} className={`message ${message.type}`}>
                        <div className="message-content">
                            <div className="message-text">{message.content}</div>

                            {message.confidence_score && (
                                <div className="confidence-score">
                                    Confidence: {(message.confidence_score * 100).toFixed(1)}%
                                </div>
                            )}

                            {message.validation_errors && message.validation_errors.length > 0 && (
                                <div className="validation-errors">
                                    <strong>⚠️ Validation Issues:</strong>
                                    <ul>
                                        {message.validation_errors.map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="message-timestamp">
                                {message.timestamp.toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="message assistant">
                        <div className="message-content">
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="bpmn-chat-actions">
                {currentBPMN && (
                    <button
                        className="action-button explain-button"
                        onClick={explainCurrentBPMN}
                        disabled={isLoading}
                    >
                        📋 Explain Current Model
                    </button>
                )}
                {messages.length > 1 && (
                    <>
                        <button
                            className="action-button export-button"
                            onClick={exportConversation}
                            disabled={isLoading}
                        >
                            📤 Export Chat
                        </button>
                        <label className="action-button import-button">
                            📥 Import Chat
                            <input
                                type="file"
                                accept=".json"
                                onChange={importConversation}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </>
                )}
            </div>

            <div className="suggested-prompts">
                <div className="prompts-header">Quick actions:</div>
                <div className="prompts-grid">
                    {SUGGESTED_PROMPTS.map((prompt, index) => (
                        <button
                            key={index}
                            className="prompt-button"
                            onClick={() => applySuggestedPrompt(prompt)}
                            disabled={isLoading}
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bpmn-chat-input">
                <div className="input-container">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Describe what you want to do with your BPMN process..."
                        disabled={isLoading}
                        className="message-input"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isLoading}
                        className="send-button"
                    >
                        {isLoading ? '⏳' : '➤'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BPMNChat;
