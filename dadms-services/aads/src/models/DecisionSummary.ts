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