"""
DADM - Decision Analysis with BPMN, OpenAI, and Neo4j

Main package for the DADM application.
"""

# Define version directly
__version__ = "0.8.0"

# Export main components
from .service_orchestrator import ServiceOrchestrator

# Backwards compatibility alias
EnhancedServiceOrchestrator = ServiceOrchestrator

__all__ = [
    'ServiceOrchestrator',
    'EnhancedServiceOrchestrator',
]
