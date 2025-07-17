"use client";

import { AutoFixHigh, CheckCircle, Edit, Info, PictureAsPdf, Save, Send, Warning } from "@mui/icons-material";
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Divider, Paper, Tab, Tabs, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import {
    ChatMessage,
    DecisionSummary,
    WhitePaper,
    getMockChatMessages,
    getMockDecisionSummary
} from "../../services/aadsApi";

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`aads-tabpanel-${index}`}
            aria-labelledby={`aads-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

export default function AASDPage() {
    const [tabValue, setTabValue] = useState(0);
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

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                // For now, use mock data. In production, these would be real API calls
                const summary = getMockDecisionSummary();
                const messages = getMockChatMessages();

                setDecisionSummary(summary);
                setChatMessages(messages);
                setApprovalStatus(summary.status);

                // Initialize white paper with default sections
                const defaultWhitePaper: WhitePaper = {
                    projectId,
                    sections: [
                        { id: "executive", title: "Executive Summary", content: "", required: true, projectId },
                        { id: "context", title: "Decision Context", content: "", required: true, projectId },
                        { id: "alternatives", title: "Alternatives Considered", content: "", required: true, projectId },
                        { id: "analysis", title: "Analysis and Rationale", content: "", required: true, projectId },
                        { id: "risks", title: "Risk Assessment", content: "", required: true, projectId },
                        { id: "recommendation", title: "Final Recommendation", content: "", required: true, projectId },
                        { id: "implementation", title: "Implementation Plan", content: "", required: false, projectId }
                    ],
                    lastModified: new Date().toISOString(),
                    version: 1
                };
                setWhitePaper(defaultWhitePaper);

            } catch (err: any) {
                setError(err.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [projectId]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleSendMessage = async () => {
        if (!chatMessage.trim() || !decisionSummary) return;

        try {
            const newMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
                sender: 'user',
                senderName: 'Current User',
                content: chatMessage,
                projectId
            };

            // In real implementation, this would be a real API call
            // const response = await sendChatMessage(projectId, newMessage);

            // For now, add to local state
            const mockResponse: ChatMessage = {
                ...newMessage,
                id: Date.now().toString(),
                timestamp: new Date().toLocaleString()
            };

            setChatMessages(prev => [...prev, mockResponse]);
            setChatMessage("");

            // Simulate AI response
            setTimeout(() => {
                const aiResponse: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    sender: 'assistant',
                    senderName: 'AI Assistant',
                    content: `I understand your message: "${chatMessage}". How can I help you with the decision finalization process?`,
                    timestamp: new Date().toLocaleString(),
                    projectId
                };
                setChatMessages(prev => [...prev, aiResponse]);
            }, 1000);

        } catch (err: any) {
            setError(err.message || 'Failed to send message');
        }
    };

    const handleUpdateWhitePaperSection = async (sectionId: string, content: string) => {
        if (!whitePaper) return;

        try {
            // In real implementation, this would be a real API call
            // await updateWhitePaperSection(projectId, sectionId, content);

            // Update local state
            setWhitePaper(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    sections: prev.sections.map(section =>
                        section.id === sectionId ? { ...section, content } : section
                    ),
                    lastModified: new Date().toISOString(),
                    version: prev.version + 1
                };
            });
        } catch (err: any) {
            setError(err.message || 'Failed to update section');
        }
    };

    const handleGenerateWithAI = async () => {
        if (!decisionSummary) return;

        try {
            setSaving(true);
            // In real implementation, this would be a real API call
            // const generated = await generateWhitePaperWithAI(projectId);

            // For now, generate mock content based on decision summary
            const generatedSections = whitePaper?.sections.map(section => {
                let content = "";
                switch (section.id) {
                    case "executive":
                        content = `This document summarizes the decision to ${decisionSummary.decision.toLowerCase()}. The analysis was conducted using ${decisionSummary.processName} and involved ${decisionSummary.participants.length} key stakeholders.`;
                        break;
                    case "context":
                        content = `The decision context involves ${decisionSummary.projectName}. The process ran from ${decisionSummary.startDate} to ${decisionSummary.endDate}.`;
                        break;
                    case "recommendation":
                        content = decisionSummary.recommendations.join(". ") + ".";
                        break;
                    case "risks":
                        content = `Key risks identified: ${decisionSummary.risks.join(". ")}.`;
                        break;
                    default:
                        content = `Content for ${section.title} will be generated based on the decision analysis.`;
                }
                return { ...section, content };
            }) || [];

            setWhitePaper(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    sections: generatedSections,
                    lastModified: new Date().toISOString(),
                    version: prev.version + 1
                };
            });
        } catch (err: any) {
            setError(err.message || 'Failed to generate with AI');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveDraft = async () => {
        if (!whitePaper) return;

        try {
            setSaving(true);
            // In real implementation, this would be a real API call
            // await saveWhitePaperDraft(projectId, whitePaper);

            // For now, just update the last modified time
            setWhitePaper(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    lastModified: new Date().toISOString(),
                    version: prev.version + 1
                };
            });
        } catch (err: any) {
            setError(err.message || 'Failed to save draft');
        } finally {
            setSaving(false);
        }
    };

    const handleExportPDF = async () => {
        try {
            setSaving(true);
            // In real implementation, this would be a real API call
            // const blob = await exportWhitePaperPDF(projectId);
            // const url = window.URL.createObjectURL(blob);
            // const a = document.createElement('a');
            // a.href = url;
            // a.download = `decision-white-paper-${projectId}.pdf`;
            // a.click();

            // For now, just show a message
            alert('PDF export would be generated here in production');
        } catch (err: any) {
            setError(err.message || 'Failed to export PDF');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitForApproval = async () => {
        if (!decisionSummary || !whitePaper) return;

        try {
            setSaving(true);
            // In real implementation, this would be a real API call
            // const response = await submitForApproval({
            //     projectId,
            //     whitePaperId: whitePaper.projectId,
            //     submittedBy: "Current User",
            //     submittedAt: new Date().toISOString()
            // });

            setApprovalStatus("submitted");
            setDecisionSummary(prev => prev ? { ...prev, status: 'submitted' } : null);
        } catch (err: any) {
            setError(err.message || 'Failed to submit for approval');
        } finally {
            setSaving(false);
        }
    };

    const getStatusIcon = () => {
        switch (approvalStatus) {
            case "draft": return <Edit />;
            case "submitted": return <Info />;
            case "under_review": return <Warning />;
            case "approved": return <CheckCircle />;
            case "rejected": return <Warning />;
            default: return <Edit />;
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ maxWidth: 1400, mx: "auto", py: 4, px: 2 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!decisionSummary || !whitePaper) {
        return (
            <Box sx={{ maxWidth: 1400, mx: "auto", py: 4, px: 2 }}>
                <Alert severity="warning">No decision data available</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1400, mx: "auto", py: 4, px: 2 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ color: "primary.main", fontWeight: "bold" }}>
                Agent Assistant & Documentation Service (AADS)
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Finalize Decision: {decisionSummary.projectName}
            </Typography>

            {/* Status Banner */}
            <Alert
                severity={approvalStatus === "approved" ? "success" : approvalStatus === "rejected" ? "error" : "info"}
                icon={getStatusIcon()}
                sx={{ mb: 3 }}
            >
                Status: {approvalStatus.replace("_", " ").toUpperCase()}
                {approvalStatus === "draft" && " - Ready to submit for approval"}
                {approvalStatus === "submitted" && " - Decision submitted for review"}
                {approvalStatus === "under_review" && " - Under review by stakeholders"}
                {approvalStatus === "approved" && " - Decision approved and ready for implementation"}
                {approvalStatus === "rejected" && " - Decision requires revision"}
            </Alert>

            <Paper elevation={2} sx={{ mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="AADS tabs">
                    <Tab label="Decision Review" />
                    <Tab label="AI Assistant & Team" />
                    <Tab label="White Paper Editor" />
                    <Tab label="Approval Submission" />
                </Tabs>
            </Paper>

            {/* Decision Review Tab */}
            <TabPanel value={tabValue} index={0}>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Project Overview</Typography>
                            <Typography><strong>Project:</strong> {decisionSummary.projectName}</Typography>
                            <Typography><strong>Decision:</strong> {decisionSummary.decision}</Typography>
                            <Typography><strong>Process:</strong> {decisionSummary.processName}</Typography>
                            <Typography><strong>Duration:</strong> {decisionSummary.startDate} to {decisionSummary.endDate}</Typography>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Participants</Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                {decisionSummary.participants.map((participant, index) => (
                                    <Chip key={index} label={participant} size="small" />
                                ))}
                            </Box>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Key Findings</Typography>
                            <ul>
                                {decisionSummary.keyFindings.map((finding, index) => (
                                    <li key={index}><Typography variant="body2">{finding}</Typography></li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Risks Identified</Typography>
                            <ul>
                                {decisionSummary.risks.map((risk, index) => (
                                    <li key={index}><Typography variant="body2" color="warning.main">{risk}</Typography></li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card sx={{ gridColumn: "1 / -1" }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Recommendations</Typography>
                            <ul>
                                {decisionSummary.recommendations.map((rec, index) => (
                                    <li key={index}><Typography variant="body2">{rec}</Typography></li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </Box>
            </TabPanel>

            {/* AI Assistant & Team Tab */}
            <TabPanel value={tabValue} index={1}>
                <Box sx={{ display: "flex", flexDirection: "column", height: 600 }}>
                    {/* Chat Messages */}
                    <Box sx={{ flex: 1, overflowY: "auto", mb: 2, p: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}>
                        {chatMessages.map((message) => (
                            <Box key={message.id} sx={{ mb: 2 }}>
                                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                    <Chip
                                        label={message.senderName}
                                        size="small"
                                        color={message.sender === "assistant" ? "primary" : message.sender === "team" ? "secondary" : "default"}
                                    />
                                    <Typography variant="caption" sx={{ ml: 1, color: "text.secondary" }}>
                                        {message.timestamp}
                                    </Typography>
                                </Box>
                                <Paper sx={{ p: 2, backgroundColor: message.sender === "assistant" ? "#f3f6ff" : "#fafafa" }}>
                                    <Typography variant="body2">{message.content}</Typography>
                                </Paper>
                            </Box>
                        ))}
                    </Box>

                    {/* Message Input */}
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <TextField
                            fullWidth
                            multiline
                            rows={2}
                            placeholder="Ask the AI assistant or add a team comment..."
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                        />
                        <Button
                            variant="contained"
                            onClick={handleSendMessage}
                            disabled={!chatMessage.trim()}
                            sx={{ minWidth: 100 }}
                        >
                            <Send />
                        </Button>
                    </Box>
                </Box>
            </TabPanel>

            {/* White Paper Editor Tab */}
            <TabPanel value={tabValue} index={2}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box>
                            <Typography variant="h6">Decision White Paper</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Draft the formal decision document. Use the AI assistant for help with content and structure.
                            </Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <Button
                                variant="outlined"
                                startIcon={<AutoFixHigh />}
                                onClick={handleGenerateWithAI}
                                disabled={saving}
                            >
                                Generate with AI
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<Save />}
                                onClick={handleSaveDraft}
                                disabled={saving}
                            >
                                Save Draft
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<PictureAsPdf />}
                                onClick={handleExportPDF}
                                disabled={saving}
                            >
                                Export PDF
                            </Button>
                        </Box>
                    </Box>

                    {saving && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            <CircularProgress size={16} sx={{ mr: 1 }} />
                            Processing...
                        </Alert>
                    )}

                    {whitePaper.sections.map((section) => (
                        <Card key={section.id}>
                            <CardContent>
                                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                    <Typography variant="h6">{section.title}</Typography>
                                    {section.required && (
                                        <Chip label="Required" size="small" color="error" sx={{ ml: 1 }} />
                                    )}
                                </Box>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    placeholder={`Enter content for ${section.title.toLowerCase()}...`}
                                    value={section.content}
                                    onChange={(e) => handleUpdateWhitePaperSection(section.id, e.target.value)}
                                />
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            </TabPanel>

            {/* Approval Submission Tab */}
            <TabPanel value={tabValue} index={3}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Submit for Approval</Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Review the decision summary and submit for formal approval through the BPMN workflow.
                        </Typography>

                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>Approval Checklist:</Typography>
                            <ul>
                                <li>Decision analysis is complete and documented</li>
                                <li>All risks have been identified and mitigation strategies defined</li>
                                <li>Stakeholder feedback has been incorporated</li>
                                <li>White paper is complete and accurate</li>
                                <li>Implementation plan is ready</li>
                            </ul>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                            <Button
                                variant="contained"
                                color="primary"
                                size="large"
                                onClick={handleSubmitForApproval}
                                disabled={approvalStatus !== "draft" || saving}
                                startIcon={<CheckCircle />}
                            >
                                {saving ? "Submitting..." : "Submit for Approval"}
                            </Button>
                            {approvalStatus !== "draft" && (
                                <Typography variant="body2" color="text.secondary">
                                    Decision has been submitted for review
                                </Typography>
                            )}
                        </Box>

                        {approvalStatus === "submitted" && (
                            <Alert severity="info" sx={{ mt: 2 }}>
                                Your decision has been submitted to the approval workflow. You will be notified when the review is complete.
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </TabPanel>
        </Box>
    );
} 