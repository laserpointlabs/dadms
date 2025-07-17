import { Request, Response } from 'express';
import { DecisionService } from '../services/DecisionService';

export class DecisionController {
    private decisionService: DecisionService;

    constructor() {
        this.decisionService = new DecisionService();
    }

    getDecisionSummary = async (req: Request, res: Response): Promise<void> => {
        try {
            const { projectId } = req.params;
            const summary = await this.decisionService.getDecisionSummary(projectId);
            res.json(summary);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    updateDecisionSummary = async (req: Request, res: Response): Promise<void> => {
        try {
            const { projectId } = req.params;
            const updateData = req.body;
            const summary = await this.decisionService.updateDecisionSummary(projectId, updateData);
            res.json(summary);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };
} 