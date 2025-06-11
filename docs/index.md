# DADM Documentation Index

Welcome to the documentation hub for the Decision Analysis and Decision Management (DADM) project. The documents below describe how to set up the environment, deploy BPMN models, and integrate services.

## Setup & Deployment
- [Codex Deployment Guide](CODEX_DEPLOYMENT_GUIDE.md) - Install and configure DADM on the Codex environment.
- [Docker Database Setup](docker_database_setup.md) - Configure Qdrant and Neo4j containers.
- [Docker Command](docker_command.md) - Manage Docker containers from the CLI.
- [Deploy Command](deploy_command.md) - Deploy BPMN models via the CLI.
- [Camunda Docker Fix](camunda_docker_fix.md) - Notes on Docker configuration for Camunda.
- [Database Upgrade to PostgreSQL](database_upgrade_postgresql.md) - Migration from H2 to PostgreSQL.
- [Python Version Guide](PYTHON_VERSION_GUIDE.md) - Ensure Python 3.10+ is available.
- [Environment Variables](environment_variables.md) - Configuration for all services.

## BPMN & Workflow
- [BPMN Validation & Deployment](BPMN_VALIDATION_DEPLOYMENT.md) - Validate and deploy BPMN models.
- [BPMN TTL Fix](bpmn_ttl_fix.md) - Add `historyTimeToLive` to BPMN files.
- [Workflow Completion Detection](WORKFLOW_COMPLETION_DETECTION.md) - Detect when processes finish.

## Services
- [Implementing Services](IMPLEMENTING_SERVICES.md) - Create and integrate new services.
- [Echo Service Tutorial](ECHO_SERVICE_TUTORIAL.md) - Example service implementation.
- [Service Architecture](service_architecture.md) - Overview of the service-oriented design.
- [Service Integration Guide](service_integration_guide.md) - Register and call microservices.
- [Service Orchestrator Optimizations](service_orchestrator_optimization.md) - Performance features.
- [Monitor Service Usage](MONITOR_SERVICE_USAGE.md) - Keep services running reliably.
- [Service Troubleshooting](SERVICE_TROUBLESHOOTING.md) - Common issues and solutions.

## Data Management
- [Analysis Data Management](analysis_data_management.md) - Architecture for storing analysis data.
- [Analysis Command](analysis_command.md) - CLI for managing analysis data.
- [Data Persistence Integration](data_persistence_integration.md) - Store interactions in Qdrant and Neo4j.
- [Vector Store Implementation](VECTOR_STORE_IMPLEMENTATION.md) - Using the OpenAI vector store API.
- [RAG File Management](rag_file_management.md) - Manage files for Retrieval-Augmented Generation.
- [OpenAI Service Analysis](openai_service_analysis.md) - Microservice implementation notes.
- [OpenAI Decision Process Testing](openai_decision_process_testing.md) - Workflow testing guide.
- [OpenAI Integration](openai_integration.md) - Running the demo with OpenAI assistants.
- [Hugging Face Dependency Fix](huggingface_dependency_fix.md) - Resolve import issues.

## Infrastructure
- [Consul Service Discovery](consul_service_discovery.md) - Using Consul for dynamic service lookup.
- [Consul Service Registry](consul_service_registry.md) - Register services in Consul.
- [Log Organization](LOG_ORGANIZATION.md) - Directory structure for logs.
- [Ontology Pipeline](ontology_pipeline.md) - Ideas for ontology-driven architecture.
- [Tool and Pipeline Integration](tool_and_pipeline_integration.md) - Guidelines for LLM tool use.
- [Architecture Best Practices](architecture_best_practices.md) - Recommended design patterns.
- [Project Specification](specification.md) - Overall system specification.

## Diagram
- `dtwfr.drawio` - Draw.io diagram for workflow relationships.

