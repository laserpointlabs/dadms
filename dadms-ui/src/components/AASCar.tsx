"use client";

import React, { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { CodiconName, Icon } from "./shared/Icon";

const TAB_ERRORS = "errors";
const TAB_INFO = "info";
const TAB_AAS = "assistant";

const TABS = [
    { id: TAB_ERRORS, name: "Errors", icon: "warning", description: "System issues" },
    { id: TAB_INFO, name: "Info", icon: "info", description: "System status" },
    { id: TAB_AAS, name: "Assistant", icon: "hubot", description: "AI assistance" },
];

export default function AASCar() {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState(TAB_AAS);
    const [aasInput, setAasInput] = useState("");
    const [conversationHistory, setConversationHistory] = useState(
        "Assistant: I'm monitoring your DADMS workspace. I noticed you have 3 active projects. Would you like me to help prioritize your next steps or provide insights on any specific project?\n\nAsk me anything about your DADMS workspace..."
    );

    const handleAasSend = () => {
        if (aasInput.trim()) {
            setConversationHistory(prev =>
                `${prev}\n\nYou: ${aasInput}\n\nAssistant: I'm processing your request...`
            );
            setAasInput("");
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAasSend();
        }
    };

        return (
        <div className="aas-panel">
                            {/* Tab Navigation */}
            <div className="aas-tabs">
                                    {TABS.map((tab) => (
                                        <button
                                            key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`aas-tab ${activeTab === tab.id ? 'active' : ''}`}
                                            title={tab.description}
                                        >
                                            <Icon name={tab.icon as CodiconName} size="sm" />
                        <span>{tab.name}</span>
                                        </button>
                                    ))}
                            </div>

            {/* Tab Content */}
            <div className="aas-content">
                {activeTab === TAB_ERRORS && (
                    <div className="aas-empty-state">
                        <Icon name="check" size="lg" className="success-icon" />
                        <p>No errors detected</p>
                        <span className="text-muted">Your system is running smoothly</span>
                                    </div>
                                )}

                {activeTab === TAB_INFO && (
                    <div className="aas-info">
                        <div className="info-item">
                            <span className="label">Status:</span>
                            <span className="value">Active</span>
                                            </div>
                        <div className="info-item">
                            <span className="label">Projects:</span>
                            <span className="value">3 active</span>
                                            </div>
                        <div className="info-item">
                            <span className="label">Theme:</span>
                            <span className="value capitalize">{theme}</span>
                                            </div>
                        <div className="info-item">
                            <span className="label">Last Updated:</span>
                            <span className="value">Just now</span>
                                        </div>
                                    </div>
                                )}

                {activeTab === TAB_AAS && (
                    <div className="aas-assistant">
                        <div className="conversation-area">
                            <pre>{conversationHistory}</pre>
                        </div>
                        <div className="input-area">
                                            <textarea
                                                value={aasInput}
                                                onChange={(e) => setAasInput(e.target.value)}
                                                onKeyPress={handleKeyPress}
                                                placeholder="Ask the assistant anything..."
                                className="aas-input"
                                                rows={2}
                                            />
                                            <button
                                                onClick={handleAasSend}
                                                disabled={!aasInput.trim()}
                                className="aas-send-button"
                                            >
                                                Send
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

            <style jsx>{`
                .aas-panel {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .aas-tabs {
                    display: flex;
                    border-bottom: 1px solid var(--theme-border);
                    background: var(--theme-bg-secondary);
                }

                .aas-tab {
                    padding: 8px 16px;
                    background: none;
                    border: none;
                    border-bottom: 2px solid transparent;
                    color: var(--theme-text-secondary);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    transition: all 0.2s;
                }

                .aas-tab:hover {
                    color: var(--theme-text-primary);
                    background: var(--theme-surface-hover);
                }

                .aas-tab.active {
                    color: var(--theme-accent-primary);
                    border-bottom-color: var(--theme-accent-primary);
                }

                .aas-content {
                    flex: 1;
                    overflow: auto;
                    padding: 16px;
                }

                .aas-empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    text-align: center;
                    color: var(--theme-text-secondary);
                }

                .success-icon {
                    color: var(--theme-accent-success);
                    margin-bottom: 12px;
                }

                .text-muted {
                    font-size: 12px;
                    color: var(--theme-text-muted);
                }

                .aas-info {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .info-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid var(--theme-border-light);
                }

                .label {
                    color: var(--theme-text-secondary);
                    font-size: 12px;
                }

                .value {
                    color: var(--theme-text-primary);
                    font-size: 12px;
                    font-weight: 500;
                }

                .capitalize {
                    text-transform: capitalize;
                }

                .aas-assistant {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .conversation-area {
                    flex: 1;
                    overflow: auto;
                    background: var(--theme-input-bg);
                    border: 1px solid var(--theme-input-border);
                    border-radius: 4px;
                    padding: 12px;
                    margin-bottom: 12px;
                }

                .conversation-area pre {
                    margin: 0;
                    white-space: pre-wrap;
                    font-family: inherit;
                    font-size: 12px;
                    color: var(--theme-text-primary);
                }

                .input-area {
                    display: flex;
                    gap: 8px;
                }

                .aas-input {
                    flex: 1;
                    background: var(--theme-input-bg);
                    border: 1px solid var(--theme-input-border);
                    color: var(--theme-text-primary);
                    padding: 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    resize: none;
                    font-family: inherit;
                }

                .aas-input:focus {
                    outline: none;
                    border-color: var(--theme-accent-primary);
                }

                .aas-send-button {
                    background: var(--theme-accent-primary);
                    color: var(--theme-text-inverse);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: opacity 0.2s;
                }

                .aas-send-button:hover:not(:disabled) {
                    opacity: 0.9;
                }

                .aas-send-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
} 