"""
Analysis Processor
Handles LLM interaction, response validation, and analysis execution
"""

import json
import asyncio
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
import logging
import time
import re

from models import (
    CompiledAnalysisPrompt, LLMResponse, AnalysisValidation,
    ProcessedAnalysis, AnalysisExecution, AnalysisServiceConfig
)
from template_manager import AnalysisTemplateManager

logger = logging.getLogger(__name__)

class AnalysisProcessor:
    """Processes compiled prompts through LLM and validates results"""
    
    def __init__(self, config: AnalysisServiceConfig, template_manager: AnalysisTemplateManager):
        self.config = config
        self.template_manager = template_manager
        
    async def process_analysis(self, compiled_prompt: CompiledAnalysisPrompt) -> ProcessedAnalysis:
        """Process a compiled analysis prompt through LLM and validate results"""
        start_time = time.time()
        
        try:
            # 1. Send to LLM
            llm_response = await self._send_to_llm(compiled_prompt)
            
            # 2. Validate response
            validation_start = time.time()
            validation = self._validate_response(
                compiled_prompt.analysis_template_id,
                llm_response.content,
                compiled_prompt.analysis_schema
            )
            validation_time = time.time() - validation_start
            
            # 3. Parse structured content
            structured_content = self._parse_structured_content(
                llm_response.content,
                compiled_prompt.analysis_schema,
                validation
            )
            
            # 4. Calculate quality score
            quality_score = self._calculate_quality_score(validation, structured_content)
            
            # 5. Generate analysis ID
            analysis_id = f"analysis_{compiled_prompt.prompt_id}_{compiled_prompt.analysis_template_id}_{int(time.time())}"
            
            processing_time = time.time() - start_time
            
            return ProcessedAnalysis(
                analysis_id=analysis_id,
                prompt_id=compiled_prompt.prompt_id,
                analysis_template_id=compiled_prompt.analysis_template_id,
                structured_content=structured_content,
                raw_llm_response=llm_response.content,
                validation=validation,
                quality_score=quality_score,
                processing_time=processing_time,
                llm_response_time=llm_response.response_time,
                validation_time=validation_time,
                metadata={
                    "llm_model": llm_response.model,
                    "tokens_used": llm_response.tokens_used,
                    "finish_reason": llm_response.finish_reason,
                    "compilation_metadata": compiled_prompt.metadata
                }
            )
            
        except Exception as e:
            logger.error(f"Error processing analysis: {e}")
            raise
    
    async def _send_to_llm(self, compiled_prompt: CompiledAnalysisPrompt) -> LLMResponse:
        """Send compiled prompt to LLM service"""
        start_time = time.time()
        
        try:
            # For now, simulate LLM response - in production, integrate with actual LLM service
            # This would typically call OpenAI, Azure OpenAI, or another LLM service
            
            if self.config.default_llm_provider == "openai":
                response_content = await self._call_openai_api(compiled_prompt)
            else:
                # Simulate response for development
                response_content = self._simulate_llm_response(compiled_prompt)
            
            response_time = time.time() - start_time
            
            return LLMResponse(
                content=response_content,
                model=self.config.default_model,
                tokens_used=len(response_content) // 4,  # Rough estimate
                finish_reason="stop",
                response_time=response_time
            )
            
        except Exception as e:
            logger.error(f"Error calling LLM: {e}")
            raise
    
    async def _call_openai_api(self, compiled_prompt: CompiledAnalysisPrompt) -> str:
        """Call OpenAI API (placeholder for actual implementation)"""
        # This would be the actual OpenAI API call
        # For now, return a simulated response
        return self._simulate_llm_response(compiled_prompt)
    
    def _simulate_llm_response(self, compiled_prompt: CompiledAnalysisPrompt) -> str:
        """Simulate LLM response for development/testing"""
        template = self.template_manager.get_template(compiled_prompt.analysis_template_id)
        
        if template and template.example_output:
            # Return the example output from the template
            return json.dumps(template.example_output, indent=2)
        
        # Generic response based on analysis type
        if compiled_prompt.analysis_template_id == "decision_analysis":
            return self._generate_decision_analysis_response()
        elif compiled_prompt.analysis_template_id == "risk_analysis":
            return self._generate_risk_analysis_response()
        elif compiled_prompt.analysis_template_id == "business_analysis":
            return self._generate_business_analysis_response()
        else:
            return '{"analysis": "Simulated analysis response", "status": "completed"}'
    
    def _generate_decision_analysis_response(self) -> str:
        """Generate a realistic decision analysis response"""
        response = {
            "decision_context": {
                "problem_statement": "Evaluate technology stack options for new project",
                "scope": "Technology selection for customer portal development",
                "timeline": "Decision needed within 4 weeks",
                "background": "Current system limitations require new approach"
            },
            "stakeholders": [
                {
                    "name": "Development Team",
                    "role": "Implementation team",
                    "influence": "high",
                    "interest": "high",
                    "concerns": ["learning curve", "development speed", "maintainability"]
                },
                {
                    "name": "Operations Team",
                    "role": "System operations",
                    "influence": "medium",
                    "interest": "high",
                    "concerns": ["deployment complexity", "monitoring", "reliability"]
                }
            ],
            "alternatives": [
                {
                    "id": "react_node",
                    "name": "React + Node.js",
                    "description": "Modern JavaScript stack",
                    "pros": ["Team familiarity", "Large ecosystem", "Fast development"],
                    "cons": ["Performance concerns", "Complexity"],
                    "cost": 75000,
                    "feasibility": "high",
                    "risk_level": "low"
                },
                {
                    "id": "python_django",
                    "name": "Python + Django",
                    "description": "Mature Python framework",
                    "pros": ["Robust framework", "Good documentation", "Security features"],
                    "cons": ["Learning curve", "Performance"],
                    "cost": 85000,
                    "feasibility": "medium",
                    "risk_level": "medium"
                }
            ],
            "evaluation_criteria": [
                {"criterion": "Development Speed", "weight": 0.3, "description": "Time to market"},
                {"criterion": "Maintainability", "weight": 0.25, "description": "Long-term maintenance"},
                {"criterion": "Performance", "weight": 0.25, "description": "System performance"},
                {"criterion": "Cost", "weight": 0.2, "description": "Total cost of ownership"}
            ],
            "analysis": {
                "scoring_matrix": [
                    {
                        "alternative_id": "react_node",
                        "scores": {"Development Speed": 9, "Maintainability": 7, "Performance": 6, "Cost": 8},
                        "weighted_score": 7.5,
                        "ranking": 1
                    },
                    {
                        "alternative_id": "python_django",
                        "scores": {"Development Speed": 6, "Maintainability": 9, "Performance": 8, "Cost": 7},
                        "weighted_score": 7.25,
                        "ranking": 2
                    }
                ],
                "sensitivity_analysis": "React option is sensitive to performance requirements",
                "key_assumptions": ["Team can adapt to new technologies", "Performance requirements stable"]
            },
            "recommendations": {
                "primary_recommendation": "React + Node.js",
                "rationale": "Best balance of development speed and team capability",
                "implementation_steps": ["Team training", "Prototype development", "Production deployment"],
                "success_metrics": ["Development velocity", "System performance", "Team satisfaction"],
                "monitoring_plan": "Weekly reviews during development, monthly performance assessments"
            },
            "risks": [
                {
                    "risk": "Performance bottlenecks",
                    "probability": "medium",
                    "impact": "high",
                    "mitigation": "Implement performance monitoring and optimization"
                },
                {
                    "risk": "Team learning curve",
                    "probability": "low",
                    "impact": "medium",
                    "mitigation": "Provide comprehensive training and mentoring"
                }
            ]
        }
        return json.dumps(response, indent=2)
    
    def _generate_risk_analysis_response(self) -> str:
        """Generate a realistic risk analysis response"""
        response = {
            "risk_context": {
                "scope": "Project implementation risks",
                "objectives": ["Deliver on time", "Stay within budget", "Meet quality standards"],
                "timeframe": "6 months",
                "stakeholders": ["Project team", "Management", "Customers"]
            },
            "risk_identification": [
                {
                    "risk_id": "R001",
                    "category": "Technical",
                    "description": "Integration complexity with legacy systems",
                    "triggers": ["API incompatibility", "Data format issues"],
                    "indicators": ["Integration test failures", "Performance degradation"]
                }
            ],
            "risk_assessment": [
                {
                    "risk_id": "R001",
                    "probability": 0.6,
                    "impact": 8,
                    "risk_score": 4.8,
                    "priority": "high"
                }
            ],
            "mitigation_strategies": [
                {
                    "risk_id": "R001",
                    "strategy": "mitigate",
                    "actions": ["Early integration testing", "Prototype development"],
                    "timeline": "2 weeks",
                    "responsible_party": "Technical Lead",
                    "cost": 15000
                }
            ],
            "monitoring_plan": {
                "review_frequency": "Weekly",
                "key_indicators": ["Integration test success rate", "Performance metrics"],
                "reporting_structure": "Weekly team meetings, monthly stakeholder updates",
                "escalation_triggers": ["Risk score > 6", "Multiple high-priority risks"]
            }
        }
        return json.dumps(response, indent=2)
    
    def _generate_business_analysis_response(self) -> str:
        """Generate a realistic business analysis response"""
        response = {
            "executive_summary": {
                "problem_statement": "Need to improve customer service efficiency",
                "recommended_solution": "Implement AI-powered chatbot system",
                "key_benefits": ["24/7 availability", "Reduced response time", "Cost savings"],
                "investment_required": 150000,
                "expected_roi": 2.5
            },
            "situation_analysis": {
                "current_state": "Manual customer service with high response times",
                "challenges": ["High workload", "Inconsistent responses", "Limited hours"],
                "opportunities": ["AI automation", "Improved satisfaction", "Cost reduction"],
                "constraints": ["Budget limitations", "Technical complexity", "Staff resistance"]
            },
            "options_analysis": [
                {
                    "option_name": "AI Chatbot Implementation",
                    "description": "Deploy intelligent chatbot for customer inquiries",
                    "benefits": ["Instant response", "24/7 availability", "Scalability"],
                    "drawbacks": ["Initial cost", "Technical complexity"],
                    "feasibility": "high",
                    "strategic_fit": "excellent"
                }
            ],
            "financial_analysis": {
                "initial_investment": 150000,
                "annual_costs": [50000, 52000, 54000],
                "annual_benefits": [80000, 85000, 90000],
                "npv": 125000,
                "irr": 0.35,
                "payback_period": 1.8,
                "break_even_point": "Month 22"
            },
            "implementation_plan": {
                "phases": [
                    {
                        "phase_name": "Planning & Design",
                        "duration": "6 weeks",
                        "key_activities": ["Requirements gathering", "System design"],
                        "deliverables": ["Project plan", "Technical specifications"],
                        "resources_required": ["Project manager", "Technical architect"]
                    }
                ],
                "critical_success_factors": ["Executive support", "User adoption", "Technical stability"],
                "major_milestones": ["Design completion", "Pilot launch", "Full deployment"]
            },
            "success_metrics": [
                {
                    "metric": "Response Time",
                    "baseline": "4 hours",
                    "target": "5 minutes",
                    "measurement_method": "System logs",
                    "frequency": "Daily"
                }
            ]
        }
        return json.dumps(response, indent=2)
    
    def _validate_response(
        self,
        template_id: str,
        response_content: str,
        expected_schema: Dict[str, Any]
    ) -> AnalysisValidation:
        """Validate LLM response against analysis template"""
        try:
            # Try to parse as JSON
            try:
                parsed_content = json.loads(response_content)
            except json.JSONDecodeError as e:
                return AnalysisValidation(
                    is_valid=False,
                    validation_errors=[f"Invalid JSON format: {str(e)}"],
                    schema_compliance=0.0,
                    missing_fields=[],
                    extra_fields=[]
                )
            
            # Use template manager for validation
            validation_result = self.template_manager.validate_template_output(template_id, parsed_content)
            
            return AnalysisValidation(
                is_valid=validation_result["valid"],
                validation_errors=validation_result.get("errors", []),
                schema_compliance=validation_result.get("compliance_score", 0.0),
                missing_fields=self._find_missing_fields(parsed_content, expected_schema),
                extra_fields=self._find_extra_fields(parsed_content, expected_schema)
            )
            
        except Exception as e:
            logger.error(f"Error validating response: {e}")
            return AnalysisValidation(
                is_valid=False,
                validation_errors=[f"Validation error: {str(e)}"],
                schema_compliance=0.0,
                missing_fields=[],
                extra_fields=[]
            )
    
    def _find_missing_fields(self, content: Dict[str, Any], schema: Dict[str, Any]) -> List[str]:
        """Find required fields that are missing from the response"""
        missing = []
        required_fields = schema.get("required", [])
        
        for field in required_fields:
            if field not in content:
                missing.append(field)
        
        return missing
    
    def _find_extra_fields(self, content: Dict[str, Any], schema: Dict[str, Any]) -> List[str]:
        """Find fields in response that aren't in the schema"""
        extra = []
        schema_properties = schema.get("properties", {})
        
        for field in content.keys():
            if field not in schema_properties:
                extra.append(field)
        
        return extra
    
    def _parse_structured_content(
        self,
        response_content: str,
        schema: Dict[str, Any],
        validation: AnalysisValidation
    ) -> Dict[str, Any]:
        """Parse and clean the structured content from LLM response"""
        try:
            if validation.is_valid:
                return json.loads(response_content)
            else:
                # Try to extract valid JSON from potentially malformed response
                json_match = re.search(r'\{.*\}', response_content, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
                else:
                    # Return minimal structure if parsing fails
                    return {"error": "Unable to parse structured content", "raw_response": response_content}
        except Exception as e:
            logger.error(f"Error parsing structured content: {e}")
            return {"error": f"Parsing error: {str(e)}", "raw_response": response_content}
    
    def _calculate_quality_score(self, validation: AnalysisValidation, structured_content: Dict[str, Any]) -> float:
        """Calculate overall quality score for the analysis"""
        score = 0.0
        
        # Schema compliance (40% of score)
        score += validation.schema_compliance * 0.4
        
        # Completeness (30% of score)
        if "error" not in structured_content:
            completeness = 1.0 - (len(validation.missing_fields) * 0.1)
            score += max(0.0, completeness) * 0.3
        
        # Validity (20% of score)
        if validation.is_valid:
            score += 0.2
        
        # Content richness (10% of score)
        content_size = len(json.dumps(structured_content))
        richness = min(1.0, content_size / 1000)  # Normalize to content size
        score += richness * 0.1
        
        return min(1.0, max(0.0, score))
    
    async def execute_analysis(self, processed_analysis: ProcessedAnalysis) -> AnalysisExecution:
        """Execute additional analysis computations and generate insights"""
        start_time = time.time()
        execution_id = f"exec_{processed_analysis.analysis_id}_{int(time.time())}"
        
        try:
            # Extract insights based on analysis type
            insights = self._extract_insights(processed_analysis)
            
            # Compute metrics
            metrics = self._compute_metrics(processed_analysis)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(processed_analysis)
            
            # Calculate confidence score
            confidence_score = self._calculate_confidence_score(processed_analysis)
            
            # Generate reliability indicators
            reliability_indicators = self._generate_reliability_indicators(processed_analysis)
            
            execution_time = time.time() - start_time
            
            return AnalysisExecution(
                execution_id=execution_id,
                analysis=processed_analysis,
                insights=insights,
                metrics=metrics,
                recommendations=recommendations,
                confidence_score=confidence_score,
                reliability_indicators=reliability_indicators,
                comparison_data=None,  # Could be populated with historical data
                benchmarks=None,       # Could be populated with benchmark comparisons
                execution_time=execution_time
            )
            
        except Exception as e:
            logger.error(f"Error executing analysis: {e}")
            raise
    
    def _extract_insights(self, processed_analysis: ProcessedAnalysis) -> Dict[str, Any]:
        """Extract key insights from the processed analysis"""
        insights = {}
        content = processed_analysis.structured_content
        
        if processed_analysis.analysis_template_id == "decision_analysis":
            insights = self._extract_decision_insights(content)
        elif processed_analysis.analysis_template_id == "risk_analysis":
            insights = self._extract_risk_insights(content)
        elif processed_analysis.analysis_template_id == "business_analysis":
            insights = self._extract_business_insights(content)
        
        return insights
    
    def _extract_decision_insights(self, content: Dict[str, Any]) -> Dict[str, Any]:
        """Extract insights from decision analysis"""
        insights = {}
        
        # Analyze alternatives
        alternatives = content.get("alternatives", [])
        if alternatives:
            insights["total_alternatives"] = len(alternatives)
            insights["cost_range"] = {
                "min": min(alt.get("cost", 0) for alt in alternatives),
                "max": max(alt.get("cost", 0) for alt in alternatives)
            }
        
        # Analyze scoring
        analysis = content.get("analysis", {})
        scoring_matrix = analysis.get("scoring_matrix", [])
        if scoring_matrix:
            insights["score_variance"] = self._calculate_score_variance(scoring_matrix)
            insights["clear_winner"] = self._has_clear_winner(scoring_matrix)
        
        return insights
    
    def _extract_risk_insights(self, content: Dict[str, Any]) -> Dict[str, Any]:
        """Extract insights from risk analysis"""
        insights = {}
        
        risk_assessment = content.get("risk_assessment", [])
        if risk_assessment:
            risk_scores = [r.get("risk_score", 0) for r in risk_assessment]
            insights["total_risks"] = len(risk_assessment)
            insights["average_risk_score"] = sum(risk_scores) / len(risk_scores)
            insights["high_priority_risks"] = len([r for r in risk_assessment if r.get("priority") == "high"])
        
        return insights
    
    def _extract_business_insights(self, content: Dict[str, Any]) -> Dict[str, Any]:
        """Extract insights from business analysis"""
        insights = {}
        
        financial = content.get("financial_analysis", {})
        if financial:
            insights["roi"] = financial.get("irr", 0)
            insights["payback_period"] = financial.get("payback_period", 0)
            insights["npv"] = financial.get("npv", 0)
        
        return insights
    
    def _compute_metrics(self, processed_analysis: ProcessedAnalysis) -> Dict[str, Union[int, float, str]]:
        """Compute analysis-specific metrics"""
        return {
            "processing_time": processed_analysis.processing_time,
            "quality_score": processed_analysis.quality_score,
            "validation_score": processed_analysis.validation.schema_compliance,
            "content_size": len(json.dumps(processed_analysis.structured_content)),
            "completion_status": "complete" if processed_analysis.validation.is_valid else "partial"
        }
    
    def _generate_recommendations(self, processed_analysis: ProcessedAnalysis) -> List[str]:
        """Generate recommendations based on analysis results"""
        recommendations = []
        
        if processed_analysis.quality_score < 0.7:
            recommendations.append("Consider re-running analysis with more specific instructions")
        
        if not processed_analysis.validation.is_valid:
            recommendations.append("Review and validate analysis output format")
        
        if processed_analysis.validation.missing_fields:
            recommendations.append("Address missing required fields in analysis")
        
        return recommendations
    
    def _calculate_confidence_score(self, processed_analysis: ProcessedAnalysis) -> float:
        """Calculate confidence score for the analysis"""
        score = processed_analysis.quality_score * 0.6  # Base on quality
        
        if processed_analysis.validation.is_valid:
            score += 0.3
        
        if not processed_analysis.validation.validation_errors:
            score += 0.1
        
        return min(1.0, score)
    
    def _generate_reliability_indicators(self, processed_analysis: ProcessedAnalysis) -> Dict[str, Any]:
        """Generate reliability indicators"""
        return {
            "schema_validation": processed_analysis.validation.is_valid,
            "completeness": len(processed_analysis.validation.missing_fields) == 0,
            "response_time": processed_analysis.llm_response_time,
            "processing_success": "error" not in processed_analysis.structured_content
        }
    
    def _calculate_score_variance(self, scoring_matrix: List[Dict[str, Any]]) -> float:
        """Calculate variance in scoring to detect close decisions"""
        if len(scoring_matrix) < 2:
            return 0.0
        
        scores = [item.get("weighted_score", 0) for item in scoring_matrix]
        mean_score = sum(scores) / len(scores)
        variance = sum((score - mean_score) ** 2 for score in scores) / len(scores)
        
        return variance
    
    def _has_clear_winner(self, scoring_matrix: List[Dict[str, Any]]) -> bool:
        """Determine if there's a clear winner in the decision"""
        if len(scoring_matrix) < 2:
            return True
        
        sorted_scores = sorted(scoring_matrix, key=lambda x: x.get("weighted_score", 0), reverse=True)
        top_score = sorted_scores[0].get("weighted_score", 0)
        second_score = sorted_scores[1].get("weighted_score", 0)
        
        # Clear winner if top score is significantly higher
        return (top_score - second_score) > 1.0
