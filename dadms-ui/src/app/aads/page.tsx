"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, Icon } from "../../components/shared";
import { TextArea } from "../../components/shared/FormField";
import { PageLayout } from "../../components/shared/PageLayout";
import {
    ChatMessage,
    DecisionSummary,
    WhitePaper,
    getMockChatMessages,
    getMockDecisionSummary
} from "../../services/aadsApi";

interface Tab {
    id: string;
    name: string;
    icon: 'comment-discussion' | 'file-text' | 'checklist';
    description: string;
}

const TABS: Tab[] = [
    { id: 'ai-assistant', name: 'AI Assistant', icon: 'comment-discussion', description: 'Decision support and analysis' },
    { id: 'documentation', name: 'Documentation', icon: 'file-text', description: 'Generate decision documents' },
    { id: 'approval', name: 'Approval Workflow', icon: 'checklist', description: 'Stakeholder review and approval' }
];

export default function AADSPage() {
    const [activeTab, setActiveTab] = useState<string>(TABS[0].id);
    const [chatMessage, setChatMessage] = useState("");
    const [approvalStatus, setApprovalStatus] = useState<"draft" | "submitted" | "under_review" | "approved" | "rejected">("draft");

    // State for data
    const [decisionSummary, setDecisionSummary] = useState<DecisionSummary | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [whitePaper, setWhitePaper] = useState<WhitePaper | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Mock project ID - in real implementation, this would come from URL params or context
    const projectId = "proj-001";

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [summaryData, messagesData] = await Promise.all([
                    getMockDecisionSummary(),
                    getMockChatMessages()
                ]);
                setDecisionSummary(summaryData);
                setChatMessages(messagesData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []); // Empty dependency array since projectId is constant

    const handleSendMessage = async () => {
        if (!chatMessage.trim()) return;

        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            content: chatMessage,
            sender: 'user',
            senderName: 'Current User',
            timestamp: new Date().toISOString(),
            projectId: projectId
        };

        setChatMessages(prev => [...prev, newMessage]);
        setChatMessage("");

        // Mock AI response
        setTimeout(() => {
            const aiResponse: ChatMessage = {
                id: (Date.now() + 1).toString(),
                content: `I understand your question about "${chatMessage}". Based on the current decision context, I recommend considering the following factors...`,
                sender: 'assistant',
                senderName: 'AI Assistant',
                timestamp: new Date().toISOString(),
                projectId: projectId
            };
            setChatMessages(prev => [...prev, aiResponse]);
        }, 1000);
    };

    const handleGenerateWhitePaper = async () => {
        setSaving(true);
        try {
            // Mock white paper generation
            const mockWhitePaper: WhitePaper = {
                projectId: projectId,
                sections: [
                    {
                        id: "1",
                        title: "Executive Summary",
                        content: `# Executive Summary\n\nThis document presents a comprehensive analysis of the decision-making process for ${decisionSummary?.decision || 'Untitled Decision'}.\n\n## Key Findings\n\n- Decision criteria have been systematically evaluated\n- Stakeholder input has been collected and analyzed\n- Risk factors have been identified and mitigated\n\n## Recommendations\n\nBased on the analysis, we recommend proceeding with the proposed decision while monitoring key risk indicators.`,
                        required: true,
                        projectId: projectId
                    }
                ],
                lastModified: new Date().toISOString(),
                version: 1
            };
            setWhitePaper(mockWhitePaper);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate white paper');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitForApproval = () => {
        setApprovalStatus("submitted");
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'ai-assistant':
                return (
                    <div className="space-y-6">
                        {/* Decision Summary */}
                        {decisionSummary && (
                            <Card variant="outlined" padding="md">
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icon name="info" size="md" className="text-theme-accent-primary" />
                                        <h3 className="text-lg font-semibold text-theme-text-primary">Decision Context</h3>
                                    </div>
                                    <h4 className="text-xl font-bold text-theme-text-primary mb-2">{decisionSummary.decision}</h4>
                                    <p className="text-theme-text-secondary">{decisionSummary.processName}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-theme-text-secondary">Status:</span>
                                        <span className="ml-2 text-theme-text-primary font-medium">{decisionSummary.status}</span>
                                    </div>
                                    <div>
                                        <span className="text-theme-text-secondary">Project:</span>
                                        <span className="ml-2 text-theme-text-primary font-medium">{decisionSummary.projectName}</span>
                                    </div>
                                    <div>
                                        <span className="text-theme-text-secondary">Start Date:</span>
                                        <span className="ml-2 text-theme-text-primary font-medium">
                                            {new Date(decisionSummary.startDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-theme-text-secondary">Participants:</span>
                                        <span className="ml-2 text-theme-text-primary font-medium">
                                            {decisionSummary.participants?.join(', ') || 'None assigned'}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Chat Interface */}
                        <Card variant="default" padding="none">
                            <div className="p-4 border-b border-theme-border">
                                <div className="flex items-center gap-2">
                                    <Icon name="chat-sparkle" size="md" className="text-theme-accent-primary" />
                                    <h3 className="text-lg font-semibold text-theme-text-primary">AI Decision Assistant</h3>
                                </div>
                                <p className="text-sm text-theme-text-secondary mt-1">
                                    Ask questions about your decision or request analysis
                                </p>
                            </div>

                            {/* Chat Messages */}
                            <div className="max-h-96 overflow-y-auto p-4 space-y-4">
                                {chatMessages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] p-3 rounded-lg ${message.role === 'user'
                                                ? 'bg-theme-accent-primary text-theme-text-inverse'
                                                : 'bg-theme-surface-elevated text-theme-text-primary border border-theme-border'
                                                }`}
                                        >
                                            <p className="text-sm">{message.content}</p>
                                            <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-theme-text-inverse opacity-70' : 'text-theme-text-muted'
                                                }`}>
                                                {new Date(message.timestamp).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Message Input */}
                            <div className="p-4 border-t border-theme-border">
                                <div className="flex gap-2">
                                    <TextArea
                                        rows={2}
                                        value={chatMessage}
                                        onChange={(e) => setChatMessage(e.target.value)}
                                        placeholder="Ask about the decision, request analysis, or seek recommendations..."
                                        className="flex-1"
                                    />
                                    <Button
                                        variant="primary"
                                        leftIcon="arrow-right"
                                        onClick={handleSendMessage}
                                        disabled={!chatMessage.trim()}
                                    >
                                        Send
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                );

            case 'documentation':
                return (
                    <div className="space-y-6">
                        <Card variant="default" padding="md">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icon name="file-text" size="md" className="text-theme-accent-primary" />
                                        <h3 className="text-lg font-semibold text-theme-text-primary">Decision Documentation</h3>
                                    </div>
                                    <p className="text-theme-text-secondary">
                                        Generate comprehensive decision documents and white papers
                                    </p>
                                </div>
                                <Button
                                    variant="primary"
                                    leftIcon="file-plus"
                                    onClick={handleGenerateWhitePaper}
                                    loading={saving}
                                    disabled={saving}
                                >
                                    Generate White Paper
                                </Button>
                            </div>

                            {whitePaper ? (
                                <div className="space-y-4">
                                    <div className="border border-theme-border rounded-lg p-4 bg-theme-surface-elevated">
                                        <h4 className="text-lg font-semibold text-theme-text-primary mb-2">
                                            {whitePaper.title}
                                        </h4>
                                        <div className="text-sm text-theme-text-secondary mb-4">
                                            Generated on {new Date(whitePaper.created_at).toLocaleString()}
                                        </div>
                                        <div className="prose prose-sm max-w-none text-theme-text-primary">
                                            <pre className="whitespace-pre-wrap font-sans">{whitePaper.content}</pre>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button variant="secondary" leftIcon="download">
                                            Download PDF
                                        </Button>
                                        <Button variant="secondary" leftIcon="share">
                                            Share Document
                                        </Button>
                                        <Button variant="tertiary" leftIcon="edit">
                                            Edit Document
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-theme-text-secondary">
                                    <Icon name="file-text" size="xl" className="mx-auto mb-4 text-theme-text-muted" />
                                    <p>No documents generated yet</p>
                                    <p className="text-sm">Click "Generate White Paper" to create your first document</p>
                                </div>
                            )}
                        </Card>
                    </div>
                );

            case 'approval':
                return (
                    <div className="space-y-6">
                        <Card variant="default" padding="md">
                            <div className="flex items-center gap-2 mb-4">
                                <Icon name="checklist" size="md" className="text-theme-accent-primary" />
                                <h3 className="text-lg font-semibold text-theme-text-primary">Approval Workflow</h3>
                            </div>

                            {/* Approval Status */}
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-3 h-3 rounded-full ${approvalStatus === 'approved' ? 'bg-theme-accent-success' :
                                        approvalStatus === 'rejected' ? 'bg-theme-accent-error' :
                                            approvalStatus === 'under_review' ? 'bg-theme-accent-warning' :
                                                'bg-theme-text-muted'
                                        }`} />
                                    <span className="text-theme-text-primary font-medium">
                                        Status: {approvalStatus.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                                <p className="text-theme-text-secondary text-sm">
                                    {approvalStatus === 'draft' && 'Decision is ready for stakeholder review'}
                                    {approvalStatus === 'submitted' && 'Decision has been submitted for approval'}
                                    {approvalStatus === 'under_review' && 'Decision is currently under review'}
                                    {approvalStatus === 'approved' && 'Decision has been approved by stakeholders'}
                                    {approvalStatus === 'rejected' && 'Decision requires revision based on feedback'}
                                </p>
                            </div>

                            {/* Stakeholder List */}
                            <div className="mb-6">
                                <h4 className="text-md font-semibold text-theme-text-primary mb-3">Stakeholders</h4>
                                <div className="space-y-2">
                                    {decisionSummary?.stakeholders?.map((stakeholder, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-theme-surface-elevated rounded-lg border border-theme-border">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-theme-accent-primary bg-opacity-20 rounded-full flex items-center justify-center">
                                                    <Icon name="person" size="sm" className="text-theme-accent-primary" />
                                                </div>
                                                <span className="text-theme-text-primary">{stakeholder}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-theme-text-secondary">
                                                <div className="w-2 h-2 rounded-full bg-theme-text-muted" />
                                                Pending Review
                                            </div>
                                        </div>
                                    )) || (
                                            <div className="text-center py-4 text-theme-text-secondary">
                                                <p>No stakeholders assigned</p>
                                            </div>
                                        )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                {approvalStatus === 'draft' && (
                                    <Button
                                        variant="primary"
                                        leftIcon="checklist"
                                        onClick={handleSubmitForApproval}
                                    >
                                        Submit for Approval
                                    </Button>
                                )}

                                <Button variant="secondary" leftIcon="comment">
                                    Add Comments
                                </Button>

                                <Button variant="tertiary" leftIcon="history">
                                    View History
                                </Button>
                            </div>

                            {/* Status Messages */}
                            {approvalStatus === "submitted" && (
                                <Alert variant="info" title="Submission Confirmed" className="mt-4">
                                    Your decision has been submitted to the approval workflow. You will be notified when the review is complete.
                                </Alert>
                            )}
                        </Card>
                    </div>
                );

            default:
                return null;
        }
    };

    if (loading) {
        return (
            <PageLayout
                title="Agent Assistant & Documentation Service"
                subtitle="AI-powered decision finalization and stakeholder collaboration"
                icon="book"
                status={{ text: 'Loading...', type: 'pending' }}
            >
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Icon name="loading" size="xl" className="text-theme-accent-primary animate-spin mx-auto mb-4" />
                        <p className="text-theme-text-secondary">Loading AADS interface...</p>
                    </div>
                </div>
            </PageLayout>
        );
    }

    if (error) {
        return (
            <PageLayout
                title="Agent Assistant & Documentation Service"
                subtitle="AI-powered decision finalization and stakeholder collaboration"
                icon="book"
                status={{ text: 'Error', type: 'error' }}
            >
                <Alert variant="error" title="Error Loading AADS" className="m-6">
                    {error}
                </Alert>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="Agent Assistant & Documentation Service"
            subtitle="AI-powered decision finalization and stakeholder collaboration"
            icon="book"
            status={{ text: 'AADS Active', type: 'active' }}
        >
            <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
                {/* Tab Navigation */}
                <Card variant="default" padding="none">
                    <div className="border-b border-theme-border">
                        <nav className="flex">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center gap-3 px-6 py-4 text-sm font-medium transition-all duration-200 border-b-2
                                        ${activeTab === tab.id
                                            ? 'text-theme-accent-primary bg-theme-surface-elevated border-theme-accent-primary'
                                            : 'text-theme-text-secondary hover:text-theme-accent-primary hover:bg-theme-surface-hover border-transparent'
                                        }
                                    `}
                                >
                                    <Icon
                                        name={tab.icon}
                                        size="md"
                                        className={activeTab === tab.id ? 'text-theme-accent-primary' : 'text-theme-text-muted'}
                                    />
                                    <div className="text-left">
                                        <div>{tab.name}</div>
                                        <div className="text-xs text-theme-text-muted">
                                            {tab.description}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {renderTabContent()}
                    </div>
                </Card>
            </div>
        </PageLayout>
    );
} 