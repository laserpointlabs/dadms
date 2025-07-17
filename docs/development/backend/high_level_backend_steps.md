# DADMS 2.0 – High-Level Backend Development Steps

This document outlines the high-level steps for backend development in DADMS 2.0, providing a structured approach for building clean, maintainable, and scalable microservices.

---

## 1. Define Core Services and Responsibilities
- List each microservice and its main purpose.
- Example:
  - **
  - **Project Service:** User/project management
  - **Knowledge Service:** Document upload, RAG search
  - **LLM Service:** LLM orchestration, tool calling
  - **AAS:** Agent assistance, documentation, approval
  - **Task Orchestrator (TEM):** Workflow task routing, service/tool invocation

## 2. Identify Key Entities and Data Models
- For each service, define the main entities (e.g., Project, Document, User, Task, Thread).
- Sketch out relationships (e.g., a Project has many Documents).

## 3. Map Core Workflows/Use Cases
- For each service, list the main user/system actions (CRUD, search, upload, etc.).
- Example:
  - Project Service: Create project, update project, list projects, delete project
  - Knowledge Service: Upload document, search documents, fetch document metadata

## 4. Define Service Interactions
- Document which services need to communicate (e.g., Task Orchestrator calls LLM Service, Knowledge Service, etc.).
- Note any event-driven flows (e.g., via Event Bus).

## 5. Assign Ports and Service URLs
- Assign a unique port to each service (e.g., 3000–3005 for core services).
- Document these assignments for local/dev orchestration.

## 6. Draft API Endpoint List (per Service)
- For each workflow/use case, define the required API endpoints (CRUD, search, etc.).
- Note request/response types, authentication, and error handling at a high level.

## 7. Document Integration Points
- Identify where external systems (e.g., BPMN engine, LLM providers, object store) are integrated.
- Note any special protocols or data formats.

## 8. Plan for Testing and Documentation
- Decide on testing approach (unit, integration, e2e).
- Plan for OpenAPI/Swagger documentation for each service.

---

## Example Table: Core Services, Entities, and Workflows

| Service           | Entities         | Key Workflows/Endpoints                | Port  |
|-------------------|------------------|----------------------------------------|-------|
| Project Service   | Project, User    | Create, update, list, delete projects  | 3000  |
| Knowledge Service | Document, Tag    | Upload, search, fetch, delete docs     | 3001  |
| LLM Service       | Prompt, Persona  | Generate, tool-call, list models       | 3002  |
| AAS               | Decision, Review | Draft, submit, approve, audit docs     | 3003  |
| Task Orchestrator | Task, Thread     | Start, route, log, analyze tasks       | 3004  |

---

**Use this document as a reference to guide API design, implementation, and documentation throughout backend development.** 