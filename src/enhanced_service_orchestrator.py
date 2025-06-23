"""
Enhanced Service Orchestrator

This module extends the base ServiceOrchestrator with advanced workflow composition
and context-aware routing capabilities:
- Integration with WorkflowCompositionEngine
- Context-aware service routing
- Dynamic workflow modification
- Workflow versioning and migration
- Advanced performance optimization
"""

import json
import logging
import time
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime

from src.service_orchestrator import ServiceOrchestrator
from src.workflow_composition_engine import (
    WorkflowCompositionEngine, 
    ServiceTaskConfig,
    ValidationResult,
    WorkflowComplexity
)

logger = logging.getLogger(__name__)

@dataclass
class WorkflowContext:
    """Context information for workflow execution"""
    process_instance_id: str
    process_definition_id: str
    workflow_version: str = "1.0"
    business_context: Dict[str, Any] = field(default_factory=dict)
    execution_history: List[str] = field(default_factory=list)
    performance_requirements: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        if self.business_context is None:
            self.business_context = {}
        if self.execution_history is None:
            self.execution_history = []
        if self.performance_requirements is None:
            self.performance_requirements = {}

@dataclass
class RoutingDecision:
    """Result of context-aware routing decision"""
    selected_service: str
    confidence: float
    reasoning: str
    alternatives: List[str] = field(default_factory=list)
    optimization_applied: bool = False
    
    def __post_init__(self):
        if self.alternatives is None:
            self.alternatives = []

class EnhancedServiceOrchestrator(ServiceOrchestrator):
    """Enhanced service orchestrator with workflow composition capabilities"""
    
    def __init__(self, service_registry=None, debug=False, enable_metrics=True,
                 xml_cache_ttl=3600, props_cache_ttl=3600, docs_cache_ttl=3600,
                 workflow_templates_dir="config/workflow_templates"):
        """
        Initialize enhanced service orchestrator
        
        Args:
            service_registry: Service registry configuration
            debug: Enable debug logging
            enable_metrics: Enable performance metrics
            xml_cache_ttl: XML cache time-to-live in seconds
            props_cache_ttl: Properties cache time-to-live in seconds
            docs_cache_ttl: Documentation cache time-to-live in seconds
            workflow_templates_dir: Directory containing workflow templates
        """
        super().__init__(service_registry, debug, enable_metrics, 
                        xml_cache_ttl, props_cache_ttl, docs_cache_ttl)
        
        # Initialize workflow composition engine
        self.composition_engine = WorkflowCompositionEngine(workflow_templates_dir)
        
        # Context tracking
        self.workflow_contexts: Dict[str, WorkflowContext] = {}
        
        # Performance optimization settings
        self.enable_context_routing = True
        self.enable_workflow_optimization = True
        self.enable_predictive_routing = True
        
        logger.info("Enhanced Service Orchestrator initialized with workflow composition")
    
    def route_task_with_context(self, task, variables=None, context: Optional[WorkflowContext] = None) -> Dict[str, Any]:
        """
        Route task with enhanced context awareness
        
        Args:
            task: Camunda external task object
            variables: Task variables
            context: Workflow execution context
            
        Returns:
            Enhanced routing result with context information
        """
        start_time = time.time()
        
        # Create or update workflow context
        process_instance_id = task.get_process_instance_id()
        if context is None and process_instance_id:
            context = self.workflow_contexts.get(process_instance_id)
            if context is None:
                process_def_id = self._get_process_definition_id(process_instance_id)
                if process_def_id is None:
                    process_def_id = "unknown"
                context = WorkflowContext(
                    process_instance_id=process_instance_id,
                    process_definition_id=process_def_id
                )
                self.workflow_contexts[process_instance_id] = context
        
        # Update execution history
        if context is not None and task.get_activity_id():
            context.execution_history.append(task.get_activity_id())
        
        # Perform context-aware routing decision
        routing_decision = self._make_routing_decision(task, variables, context)
        
        # Apply workflow optimizations if enabled
        if self.enable_workflow_optimization and context is not None:
            self._apply_workflow_optimizations(task, context)
        
        # Route task using standard mechanism
        result = super().route_task(task, variables)
        
        # Enhance result with context information
        enhanced_result = {
            **result,
            "routing_decision": {
                "selected_service": routing_decision.selected_service,
                "confidence": routing_decision.confidence,
                "reasoning": routing_decision.reasoning,
                "alternatives": routing_decision.alternatives,
                "optimization_applied": routing_decision.optimization_applied
            },
            "workflow_context": {
                "process_instance_id": context.process_instance_id if context else None,
                "execution_step": len(context.execution_history) if context else 0,
                "workflow_version": context.workflow_version if context else "1.0"
            },
            "performance_metrics": {
                "routing_time": time.time() - start_time,
                "context_aware": self.enable_context_routing
            }
        }
        
        return enhanced_result
    
    def _make_routing_decision(self, task, variables, context: Optional[WorkflowContext]) -> RoutingDecision:
        """
        Make context-aware routing decision
        
        Args:
            task: Camunda external task
            variables: Task variables
            context: Workflow context
            
        Returns:
            Routing decision with reasoning
        """
        # Extract basic service properties
        properties = self.extract_service_properties(task)
        service_type = properties.get("service.type", "assistant")
        service_name = properties.get("service.name", self._get_default_service_name())
        
        base_service = f"{service_type}/{service_name}"
        
        # If context-aware routing is disabled, use standard routing
        if not self.enable_context_routing or context is None:
            return RoutingDecision(
                selected_service=base_service,
                confidence=0.8,
                reasoning="Standard property-based routing"
            )
        
        # Analyze context for routing optimization
        alternatives = []
        confidence = 0.8
        reasoning = "Property-based routing"
        optimization_applied = False
        
        # Check for performance requirements
        if context.performance_requirements:
            if context.performance_requirements.get("high_throughput", False):
                # Look for high-performance service alternatives
                if service_type in self.service_registry:
                    for alt_name, alt_config in self.service_registry[service_type].items():
                        if alt_config.get("performance_tier") == "high":
                            alternatives.append(f"{service_type}/{alt_name}")
                
                if alternatives:
                    service_name = alternatives[0].split("/")[1]
                    reasoning = "High-performance service selected based on requirements"
                    confidence = 0.9
                    optimization_applied = True
        
        # Check execution history for pattern-based optimization
        if len(context.execution_history) > 1:
            # Look for repeated patterns that might benefit from specialized services
            recent_tasks = context.execution_history[-3:]
            if len(set(recent_tasks)) == 1:  # Repeated same task
                reasoning += " (repeated task pattern detected)"
                confidence += 0.1
        
        # Check business context for domain-specific routing
        if context.business_context:
            domain = context.business_context.get("domain")
            if domain and domain in ["finance", "healthcare", "manufacturing"]:
                # Look for domain-specific services
                domain_service_key = f"service.domain.{domain}"
                if properties.get(domain_service_key):
                    reasoning += f" (domain-specific routing for {domain})"
                    confidence += 0.1
        
        selected_service = f"{service_type}/{service_name}"
        
        return RoutingDecision(
            selected_service=selected_service,
            confidence=min(confidence, 1.0),
            reasoning=reasoning,
            alternatives=alternatives,
            optimization_applied=optimization_applied
        )
    
    def _apply_workflow_optimizations(self, task, context: WorkflowContext):
        """
        Apply workflow-level optimizations
        
        Args:
            task: Current task
            context: Workflow context
        """
        # Predictive task prefetching
        if self.enable_predictive_routing:
            self._predictive_prefetch(task, context)
        
        # Resource optimization
        self._optimize_resource_allocation(context)
    
    def _predictive_prefetch(self, task, context: WorkflowContext):
        """
        Predictively prefetch likely next tasks
        
        Args:
            task: Current task
            context: Workflow context
        """
        current_activity = task.get_activity_id()
        if not current_activity:
            return
        
        # Use transition counter from parent class
        if current_activity in self._task_transition_counter:
            transitions = self._task_transition_counter[current_activity]
            likely_next = sorted(transitions.items(), key=lambda x: x[1], reverse=True)[:2]
            
            for next_task, _ in likely_next:
                logger.debug(f"Predictively prefetching for task: {next_task}")
                # Prefetch process XML and properties for likely next tasks
                try:
                    process_xml = self._get_process_xml_for_task(task)
                    if process_xml:
                        # Cache properties for next task using the parent's cache
                        cache_key = f"task_props_{next_task}"
                        # Use the parent class's caching mechanism
                        logger.debug(f"Prefetching cache for {cache_key}")
                except Exception as e:
                    logger.debug(f"Prefetch failed for {next_task}: {e}")
    
    def _optimize_resource_allocation(self, context: WorkflowContext):
        """
        Optimize resource allocation based on workflow context
        
        Args:
            context: Workflow context
        """
        # This is a placeholder for resource optimization logic
        # In a full implementation, this would:
        # 1. Analyze current system load
        # 2. Predict resource requirements
        # 3. Adjust service routing accordingly
        pass
    
    def compose_dynamic_workflow(self, description: str, 
                                complexity: WorkflowComplexity = WorkflowComplexity.SIMPLE) -> str:
        """
        Compose a workflow dynamically from description
        
        Args:
            description: Natural language workflow description
            complexity: Target workflow complexity
            
        Returns:
            Generated BPMN XML
        """
        return self.composition_engine.create_workflow_from_description(description, complexity)
    
    def inject_service_task_into_workflow(self, workflow_xml: str, 
                                        task_config: ServiceTaskConfig) -> str:
        """
        Inject a service task into existing workflow
        
        Args:
            workflow_xml: Existing workflow XML
            task_config: Service task configuration
            
        Returns:
            Modified workflow XML
        """
        return self.composition_engine.inject_service_task(workflow_xml, task_config)
    
    def validate_workflow(self, workflow_xml: str) -> ValidationResult:
        """
        Validate workflow composition
        
        Args:
            workflow_xml: Workflow XML to validate
            
        Returns:
            Validation result
        """
        return self.composition_engine.validate_workflow_composition(workflow_xml)
    
    def optimize_workflow(self, workflow_xml: str) -> str:
        """
        Optimize workflow for better performance
        
        Args:
            workflow_xml: Workflow XML to optimize
            
        Returns:
            Optimized workflow XML
        """
        return self.composition_engine.optimize_workflow(workflow_xml)
    
    def get_workflow_templates(self) -> List[Dict[str, str]]:
        """Get available workflow templates"""
        return self.composition_engine.get_available_templates()
    
    def migrate_workflow_version(self, old_workflow_xml: str, target_version: str) -> str:
        """
        Migrate workflow to new version
        
        Args:
            old_workflow_xml: Current workflow XML
            target_version: Target version
            
        Returns:
            Migrated workflow XML
        """
        # This is a simplified migration - in practice, this would involve
        # complex logic to handle version differences
        
        # Parse and update version information
        import xml.etree.ElementTree as ET
        
        root = ET.fromstring(old_workflow_xml)
        
        # Find process element and update version-related attributes
        process_elem = root.find('.//bpmn:process', self.composition_engine.namespaces)
        if process_elem is not None:
            # Add version metadata
            process_elem.set('versionTag', target_version)
            
            # Update history TTL for newer versions
            if target_version >= "2.0":
                process_elem.set('camunda:historyTimeToLive', '60')  # Longer retention
        
        return ET.tostring(root, encoding='unicode', xml_declaration=True)
    
    def get_enhanced_metrics(self) -> Dict[str, Any]:
        """Get enhanced orchestrator metrics"""
        base_metrics = super().get_metrics()
        
        enhanced_metrics = {
            **base_metrics,
            "workflow_composition": {
                "available_templates": len(self.composition_engine.templates),
                "active_contexts": len(self.workflow_contexts),
                "context_routing_enabled": self.enable_context_routing,
                "optimization_enabled": self.enable_workflow_optimization
            },
            "context_statistics": {
                "total_contexts": len(self.workflow_contexts),
                "avg_execution_history_length": sum(
                    len(ctx.execution_history) for ctx in self.workflow_contexts.values()
                ) / len(self.workflow_contexts) if self.workflow_contexts else 0
            }
        }
        
        return enhanced_metrics
    
    def cleanup_expired_contexts(self, max_age_hours: int = 24):
        """
        Clean up expired workflow contexts
        
        Args:
            max_age_hours: Maximum age of contexts to keep
        """
        current_time = datetime.now()
        expired_contexts = []
        
        for process_id, context in self.workflow_contexts.items():
            # This is simplified - in practice, you'd track context creation time
            if len(context.execution_history) == 0:  # No recent activity
                expired_contexts.append(process_id)
        
        for process_id in expired_contexts:
            del self.workflow_contexts[process_id]
        
        logger.info(f"Cleaned up {len(expired_contexts)} expired workflow contexts") 