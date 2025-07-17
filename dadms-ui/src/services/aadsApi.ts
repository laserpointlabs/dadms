// AADS API Service
// Handles communication with the Agent Assistant & Documentation Service

export interface DecisionSummary {
    projectId: string;
    projectName: string;
    decision: string;
    processName: string;
    startDate: string;
    endDate: string;
    participants: string[];
    keyFindings: string[];
    risks: string[];
    recommendations: string[];
    status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
}

export interface ChatMessage {
    id: string;
    sender: 'user' | 'assistant' | 'team';
    content: string;
    timestamp: string;
    senderName: string;
    projectId: string;
}

export interface WhitePaperSection {
    id: string;
    title: string;
    content: string;
    required: boolean;
    projectId: string;
}

export interface WhitePaper {
    projectId: string;
    sections: WhitePaperSection[];
    lastModified: string;
    version: number;
}

export interface ApprovalRequest {
    projectId: string;
    whitePaperId: string;
    submittedBy: string;
    submittedAt: string;
    comments?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3005';

// Decision Summary API
export const fetchDecisionSummary = async (projectId: string): Promise<DecisionSummary> => {
    const response = await fetch(`${API_BASE_URL}/api/decisions/${projectId}/summary`);
    if (!response.ok) {
        throw new Error(`Failed to fetch decision summary: ${response.statusText}`);
    }
    return response.json();
};

export const updateDecisionSummary = async (projectId: string, summary: Partial<DecisionSummary>): Promise<DecisionSummary> => {
    const response = await fetch(`${API_BASE_URL}/api/decisions/${projectId}/summary`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(summary),
    });
    if (!response.ok) {
        throw new Error(`Failed to update decision summary: ${response.statusText}`);
    }
    return response.json();
};

// Chat Messages API
export const fetchChatMessages = async (projectId: string): Promise<ChatMessage[]> => {
    const response = await fetch(`${API_BASE_URL}/api/decisions/${projectId}/chat`);
    if (!response.ok) {
        throw new Error(`Failed to fetch chat messages: ${response.statusText}`);
    }
    return response.json();
};

export const sendChatMessage = async (projectId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> => {
    const response = await fetch(`${API_BASE_URL}/api/decisions/${projectId}/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
    });
    if (!response.ok) {
        throw new Error(`Failed to send chat message: ${response.statusText}`);
    }
    return response.json();
};

// White Paper API
export const fetchWhitePaper = async (projectId: string): Promise<WhitePaper> => {
    const response = await fetch(`${API_BASE_URL}/api/decisions/${projectId}/white-paper`);
    if (!response.ok) {
        throw new Error(`Failed to fetch white paper: ${response.statusText}`);
    }
    return response.json();
};

export const updateWhitePaperSection = async (
    projectId: string,
    sectionId: string,
    content: string
): Promise<WhitePaperSection> => {
    const response = await fetch(`${API_BASE_URL}/api/decisions/${projectId}/white-paper/sections/${sectionId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
    });
    if (!response.ok) {
        throw new Error(`Failed to update white paper section: ${response.statusText}`);
    }
    return response.json();
};

export const generateWhitePaperWithAI = async (projectId: string): Promise<WhitePaper> => {
    const response = await fetch(`${API_BASE_URL}/api/decisions/${projectId}/white-paper/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to generate white paper: ${response.statusText}`);
    }
    return response.json();
};

export const saveWhitePaperDraft = async (projectId: string, whitePaper: WhitePaper): Promise<WhitePaper> => {
    const response = await fetch(`${API_BASE_URL}/api/decisions/${projectId}/white-paper/draft`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(whitePaper),
    });
    if (!response.ok) {
        throw new Error(`Failed to save white paper draft: ${response.statusText}`);
    }
    return response.json();
};

export const exportWhitePaperPDF = async (projectId: string): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/api/decisions/${projectId}/white-paper/export/pdf`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to export white paper: ${response.statusText}`);
    }
    return response.blob();
};

// Approval API
export const submitForApproval = async (approvalRequest: ApprovalRequest): Promise<{ approvalId: string; status: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/decisions/${approvalRequest.projectId}/approval`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(approvalRequest),
    });
    if (!response.ok) {
        throw new Error(`Failed to submit for approval: ${response.statusText}`);
    }
    return response.json();
};

export const getApprovalStatus = async (projectId: string): Promise<{ status: string; approvalId?: string; comments?: string[] }> => {
    const response = await fetch(`${API_BASE_URL}/api/decisions/${projectId}/approval/status`);
    if (!response.ok) {
        throw new Error(`Failed to get approval status: ${response.statusText}`);
    }
    return response.json();
};

// Mock data for development (remove in production)
export const getMockDecisionSummary = (): DecisionSummary => ({
    projectId: "proj-001",
    projectName: "UAV Fleet Modernization Decision",
    decision: "Proceed with acquisition of 15 MQ-9B SkyGuardian UAVs",
    processName: "Multi-Criteria Decision Analysis",
    startDate: "2024-01-10",
    endDate: "2024-01-15",
    participants: ["Col. Smith", "Maj. Johnson", "Dr. Williams"],
    keyFindings: [
        "MQ-9B provides 40% better endurance than current fleet",
        "Integration cost is within budget constraints",
        "Training requirements are manageable with existing infrastructure"
    ],
    risks: [
        "Supply chain delays may impact delivery timeline",
        "New maintenance procedures require additional training",
        "Cybersecurity requirements need additional review"
    ],
    recommendations: [
        "Proceed with acquisition as planned",
        "Establish dedicated training program",
        "Implement cybersecurity audit before deployment"
    ],
    status: 'draft'
});

export const getMockChatMessages = (): ChatMessage[] => [
    {
        id: "1",
        sender: "assistant",
        senderName: "AI Assistant",
        content: "I've reviewed the decision analysis. The risk assessment looks comprehensive, but I recommend adding a contingency plan for supply chain delays.",
        timestamp: "2024-01-15 14:30",
        projectId: "proj-001"
    },
    {
        id: "2",
        sender: "user",
        senderName: "Col. Smith",
        content: "Good point. We should include backup suppliers in the final recommendation.",
        timestamp: "2024-01-15 14:35",
        projectId: "proj-001"
    },
    {
        id: "3",
        sender: "team",
        senderName: "Maj. Johnson",
        content: "I agree. Also, we need to address the cybersecurity concerns more explicitly in the white paper.",
        timestamp: "2024-01-15 14:40",
        projectId: "proj-001"
    }
]; 