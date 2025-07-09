import { AgentReviewRequest, AgentReviewResponse } from '../types';

export class PromptQualityAgent {
    private name = 'PromptQualityAgent';
    private description = 'Analyzes prompt quality, coverage, and best practices';

    async review(request: AgentReviewRequest): Promise<AgentReviewResponse> {
        const startTime = Date.now();
        const findings: any[] = [];

        try {
            const { event } = request;

            // Only process prompt-related events
            if (!event.entity || event.entity.type !== 'prompt') {
                return {
                    findings: [],
                    review_time_ms: Date.now() - startTime
                };
            }

            const prompt = event.entity.data;

            // Check prompt length
            if (prompt.text && prompt.text.length > 2000) {
                findings.push({
                    entity_type: 'prompt',
                    entity_id: prompt.id,
                    agent_name: this.name,
                    level: 'warning',
                    message: 'Prompt is very long and may be difficult to process efficiently',
                    suggested_action: 'Consider breaking the prompt into smaller, more focused prompts',
                    details: { prompt_length: prompt.text.length }
                });
            }

            // Check for test coverage
            if (!prompt.test_cases || prompt.test_cases.length === 0) {
                findings.push({
                    entity_type: 'prompt',
                    entity_id: prompt.id,
                    agent_name: this.name,
                    level: 'warning',
                    message: 'Prompt has no associated test cases',
                    suggested_action: 'Add at least one test case to validate prompt behavior',
                    details: { test_case_count: 0 }
                });
            } else if (prompt.test_cases.length < 3) {
                findings.push({
                    entity_type: 'prompt',
                    entity_id: prompt.id,
                    agent_name: this.name,
                    level: 'suggestion',
                    message: 'Prompt has limited test coverage',
                    suggested_action: 'Add more test cases to cover edge cases and variations',
                    details: { test_case_count: prompt.test_cases.length }
                });
            }

            // Check for clear instructions
            const hasInstructions = prompt.text.toLowerCase().includes('please') ||
                prompt.text.toLowerCase().includes('should') ||
                prompt.text.toLowerCase().includes('must');

            if (!hasInstructions) {
                findings.push({
                    entity_type: 'prompt',
                    entity_id: prompt.id,
                    agent_name: this.name,
                    level: 'suggestion',
                    message: 'Prompt lacks clear instructions or directives',
                    suggested_action: 'Add clear instructions about what the AI should do',
                    details: { has_instructions: false }
                });
            }

            // Check for context
            const hasContext = prompt.text.toLowerCase().includes('context') ||
                prompt.text.toLowerCase().includes('background') ||
                prompt.text.toLowerCase().includes('given');

            if (!hasContext && prompt.text.length > 100) {
                findings.push({
                    entity_type: 'prompt',
                    entity_id: prompt.id,
                    agent_name: this.name,
                    level: 'info',
                    message: 'Consider adding context or background information',
                    suggested_action: 'Provide relevant context to improve prompt effectiveness',
                    details: { has_context: false }
                });
            }

            // Check for specific output format
            const hasOutputFormat = prompt.text.toLowerCase().includes('format') ||
                prompt.text.toLowerCase().includes('json') ||
                prompt.text.toLowerCase().includes('xml') ||
                prompt.text.toLowerCase().includes('structure');

            if (!hasOutputFormat && prompt.type === 'tool-aware') {
                findings.push({
                    entity_type: 'prompt',
                    entity_id: prompt.id,
                    agent_name: this.name,
                    level: 'suggestion',
                    message: 'Tool-aware prompt should specify expected output format',
                    suggested_action: 'Add output format specification for better tool integration',
                    details: { has_output_format: false, prompt_type: prompt.type }
                });
            }

            // Check for potential bias indicators
            const biasKeywords = ['always', 'never', 'everyone', 'nobody', 'best', 'worst'];
            const foundBiasKeywords = biasKeywords.filter(keyword =>
                prompt.text.toLowerCase().includes(keyword)
            );

            if (foundBiasKeywords.length > 0) {
                findings.push({
                    entity_type: 'prompt',
                    entity_id: prompt.id,
                    agent_name: this.name,
                    level: 'warning',
                    message: 'Prompt contains potentially biased language',
                    suggested_action: 'Review and revise language to reduce potential bias',
                    details: { bias_keywords: foundBiasKeywords }
                });
            }

            // Check for versioning
            if (prompt.version === 1 && event.event_type === 'prompt_created') {
                findings.push({
                    entity_type: 'prompt',
                    entity_id: prompt.id,
                    agent_name: this.name,
                    level: 'info',
                    message: 'First version of prompt created',
                    suggested_action: 'Consider documenting the changes and reasoning',
                    details: { version: prompt.version }
                });
            }

        } catch (error) {
            findings.push({
                entity_type: 'prompt',
                entity_id: request.event.entity?.id || 'unknown',
                agent_name: this.name,
                level: 'error',
                message: 'Failed to analyze prompt quality',
                suggested_action: 'Review the prompt manually and check for syntax issues',
                details: { error: error instanceof Error ? error.message : 'Unknown error' }
            });
        }

        return {
            findings,
            review_time_ms: Date.now() - startTime
        };
    }

    getName(): string {
        return this.name;
    }

    getDescription(): string {
        return this.description;
    }
} 