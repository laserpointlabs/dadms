# DADMS MVP2 Specification

This document outlines the core and future-facing features for DADMS 2.0 (MVP2), including both MVP requirements and broader architectural considerations. It is a living document to guide implementation, integration, and extensibility.

---

## Table of Contents
1. [Artifact Management Service (AMS)](#artifact-management-service-ams)
2. [User Tasks Page](#user-tasks-page)
3. [Process Definition Assistant (PDA)](#process-definition-assistant-pda)
4. [Agent Assistance Service (AAS)](#agent-assistance-service-aas)
5. [Impact Analysis Service (IAS)](#impact-analysis-service-ias)
6. [Requirements and Conceptualization Service (RACS)](#requirements-and-conceptualization-service-racs)
7. [Ontology Extraction and Creation Service (ODES)](#ontology-extraction-and-creation-service-odes)
8. [Data Management Service (DMS)](#data-management-service-dms)
9. [Event Management Service (EMS)](#event-management-service-ems)
10. [Modeling and Analysis Service (MAS)](#modeling-and-analysis-service-mas)

---

## 1. Artifact Management Service (AMS)
**Purpose:**
- Manage all artifacts (documents, diagrams, generated content, etc.) in DADMS.
- Hybrid approach: LLM-generated artifacts (e.g., Mermaid, Markdown, JSON) are stored as vectors in the vector store; large/binary/user-uploaded artifacts are stored in the knowledge management section (MinIO/object store), with metadata and embeddings in the vector store.

**Integration:**
- Artifacts are linked to process runs, threads, or decisions via metadata.
- No separate artifact manager UI for MVP; upload/search/retrieval is integrated into knowledge and process UIs.
- See [Development Process Document](./dadms_development_process.md#artifact-management-strategy) for detailed rationale and workflow.

**Future:**
- Versioning, explicit artifact lifecycle, and advanced artifact manager UI as needed.

---

## 2. User Tasks Page
**Purpose:**
- Provide users with a dashboard of active human tasks (e.g., input, review, approval) assigned via BPMN workflows.

**Integration:**
- Pull user tasks from Camunda API for the logged-in user.
- Scaffold a dedicated page in DADMS listing active tasks, with links to complete/review them.
- MVP: Basic list and completion UI; Future: notifications, advanced filtering, and task context display.

---

## 3. Process Definition Assistant (PDA)
**Purpose:**
- LLM-powered assistant for BPMN process generation and modification.
- Converts natural language to BPMN, supports context-aware editing, and validates BPMN structure.

**Features:**
- External prompt management from files
- Example storage/retrieval (vector store)
- BPMN structure validation
- Configurable prompt templates
- Vector store integration for examples

**Integration:**
- Can be a persona or subset of AAS.
- See legacy code for reference: [enhanced_bpmn_ai_service.py](https://github.com/laserpointlabs/dadms/blob/fix/postgres_fix_after_llm_integration/src/services/enhanced_bpmn_ai_service.py)

---

## 4. Agent Assistance Service (AAS)
**Purpose:**
- Supervisory/assistant service tied to the event service, monitoring all internal/external events.
- Evaluates impacts, offers feedback, and interacts with users/teams.

**Integration:**
- Scaffold a management page and a lower bar (info/errors/AAS tabs) in the main UI.
- AAS can perform CRUD on artifacts, knowledge, BPMN definitions, threads, and decisions.
- Agents/personas are selected based on context or user questions.
- AAS may use local/remote LLMs, execute code, and inform users in real time.

**Future:**
- Deep integration with all DADMS services; AAS as a central orchestrator and advisor.

---

## 5. Impact Analysis Service (IAS)
**Purpose:**
- Allow users to discuss potential impacts of changes with the AAS in real time.
- Leverage vector/graph store to surface similar/affected tasks, processes, or decisions.

**Integration:**
- UI: Impact analysis tab in Thread Manager, similarity explorer in process/task views.
- Backend: Integrate with vector/graph stores for semantic search and impact reporting.

---

## 6. Requirements and Conceptualization Service (RACS)
**Purpose:**
- Extract requirements, constraints, and conceptual models from project documents.
- Store requirements as project artifacts; use ontology templates for conceptualization.

**Workflow Example:**
- Upload a capabilities/requirements document.
- Auto-extract 'shall' and fuzzy requirements/constraints.
- AAS reviews, suggests improvements, and notes overlaps.
- Use ontology to instantiate components, processes, and functions, resulting in a conceptual system model.

**Integration:**
- Requirements and conceptual models are stored as artifacts and linked to projects.
- AAS requirements expert persona assists in review and conceptualization.

---

## 7. Ontology Extraction and Creation Service (ODES)
**Purpose:**
- Extract and build ontologies from project/domain knowledge and documents.
- Ensure formal integration of external domain data.

**Features:**
- Iterative extraction with AAS guidance.
- Ontology versioning and management (consider RDF server like Fuseki).
- Visual editing (draw.io or similar integration) and open-source publishing (e.g., ROBOT).

**Integration:**
- Ontologies inform the Data Manager about allowed data structures.
- Ontologies are linked to projects/domains and versioned.

---

## 8. Data Management Service (DMS)
**Purpose:**
- Generalized data service for connecting to external, live, or historical datasets.
- Data can be pulled on schedule, on-demand, or in response to events.

**Integration:**
- Data mapped via ontology definitions.
- Consider open-source tools (e.g., Apache NiFi) for mapping and integration.

---

## 9. Event Management Service (EMS)
**Purpose:**
- Capture, log, and react to events within DADMS.
- May use Node-RED, Apache NiFi, or similar for rapid integration.

**Integration:**
- All services and the AAS subscribe to and act on events.
- Event logs are available for audit and analysis.

---

## 10. Modeling and Analysis Service (MAS)
**Purpose:**
- Provide flexible modeling and analysis capabilities (e.g., JupyterLab/Hub integration).
- Support optimization, simulation, and advanced analytics.

**Integration:**
- Access to all project data, processes, artifacts, and knowledge.
- AAS can trigger or assist with modeling/analysis tasks.

---

## AAS as Central Orchestrator
- The AAS should have access, authority, and input on all DADMS operations.
- All services are designed for AAS integration, enabling real-time feedback, automation, and continuous improvement.

---

### AAS Configuration Page & Popup Car UI

**AAS Configuration Page:**
- Dedicated page for configuring AAS settings, agent/persona selection, and oversight level.
- Allows users/admins to view and edit AAS parameters, select which agents are active, and set the level of AI oversight.
- Provides manual triggers for AAS review or feedback on any entity.

**AAS Popup Car (Bottom UI Component):**
- Persistent, adjustable-height popup at the bottom of the DADMS UI.
- Contains three horizontally split tabs: Errors, Info, and AAS.
  - **Errors Tab:** Displays error logs and actionable alerts.
  - **Info Tab:** Shows recent system events and notifications.
  - **AAS Tab:** Interactive chat/feedback area for AI oversight and user queries.
- Features a drag handle for height adjustment and a hide/show button for user control.
- Designed to be always accessible but non-intrusive, providing "mission control" and "AI co-pilot" functionality.

---

## MVP vs. Future Features
- **MVP:**
  - Core project/knowledge management
  - UI scaffolding for all major pages
  - Basic artifact/document management (hybrid approach)
  - User tasks page (basic)
  - Initial AAS and PDA scaffolding
- **Future:**
  - Full RACS, ODES, DMS, EMS, MAS implementations
  - Advanced artifact/versioning, ontology management, and event-driven automation
  - Deep AAS integration and agent-based orchestration

---

*This document will be updated as features are implemented and requirements evolve. See the [Development Process Document](./dadms_development_process.md) for ongoing decisions and rationale.* 