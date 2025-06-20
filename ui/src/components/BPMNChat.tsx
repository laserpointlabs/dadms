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
    bpmn_xml: string;
    explanation: string;
    elements_created: string[];
    suggestions: string[];
    confidence_score: number;
    validation_errors: string[];
}

interface BPMNChatProps {
    onBPMNUpdate?: (bpmnXml: string) => void;
    currentBPMN?: string;
}

const BPMNChat: React.FC<BPMNChatProps> = ({ onBPMNUpdate, currentBPMN }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
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

        // Add welcome message
        const welcomeMessage: Message = {
            id: Date.now().toString(),
            type: 'assistant',
            content: 'Hello! I\'m your BPMN AI assistant. I can help you create, modify, and understand BPMN process models. What would you like to work on today?',
            timestamp: new Date()
        };
        setMessages([welcomeMessage]);
    }, []);

    useEffect(() => {
        // Scroll to bottom when new messages are added
        scrollToBottom();
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

            // Determine if this is a generation or modification request
            if (currentBPMN && message.toLowerCase().includes('modify')) {
                endpoint = '/api/bpmn-ai/modify';
                payload = {
                    current_bpmn: currentBPMN,
                    modification_request: message,
                    context: {
                        conversation_history: messages.slice(-5) // Last 5 messages for context
                    }
                };
            } else {
                endpoint = '/api/bpmn-ai/generate';
                payload = {
                    user_input: message,
                    context: {
                        conversation_history: messages.slice(-5),
                        current_model: currentBPMN || null
                    }
                };
            }

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

            // Create assistant message with BPMN result
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: result.explanation,
                timestamp: new Date(),
                bpmn_xml: result.bpmn_xml,
                confidence_score: result.confidence_score,
                validation_errors: result.validation_errors
            };

            setMessages(prev => [...prev, assistantMessage]);

            // Notify parent component of BPMN update
            if (onBPMNUpdate && result.bpmn_xml) {
                onBPMNUpdate(result.bpmn_xml);
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

    const useSuggestedPrompt = (prompt: string) => {
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
                <h3>BPMN AI Assistant</h3>
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
            </div>

            <div className="suggested-prompts">
                <div className="prompts-header">Quick actions:</div>
                <div className="prompts-grid">
                    {SUGGESTED_PROMPTS.map((prompt, index) => (
                        <button
                            key={index}
                            className="prompt-button"
                            onClick={() => useSuggestedPrompt(prompt)}
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
