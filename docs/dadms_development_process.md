# DADMS Development Process Capture

## Purpose
This document captures the ongoing development process, key decisions, rationale, and milestones for the DADMS 2.0 project. It serves as a living record to ensure transparency, knowledge sharing, and continuous improvement.

---

## Process Overview
- **Scaffold First:** Rapidly prototype UI/UX with local state and placeholder data.
- **Iterate on UX:** Validate workflows and get feedback before backend integration.
- **API Integration:** Replace local state with real API/database calls once UI is validated.
- **Continuous Documentation:** Update this document as decisions are made and milestones are reached.

---

## Key Decisions & Rationale
- **UI Scaffolding:** Use local state for domains/tags to enable fast iteration and feedback.
- **Domain/Tag Model:** Domains and tags are managed centrally for governance and reusability. Tags can span multiple domains (multi-select).
- **Separation of Concerns:** Frontend handles UX, backend handles chunking, vectorization, and storage.
- **Best Practice Alignment:** Follow modern SaaS and knowledge management patterns for extensibility and maintainability.

---

## Milestones & Progress
- **Day 1:** Project CRUD UI and backend complete.
- **Day 2:** Knowledge page scaffolded; Domain and Tag management UIs scaffolded with local state.
- **Next:** Document upload and RAG search UI scaffolding; backend API integration for knowledge entities.

---

## Next Steps
- Scaffold Document Upload and Knowledge Search UIs.
- Define and implement backend API endpoints for domains, tags, documents, and search.
- Integrate frontend with backend for persistent data.
- Continue to update this document as new decisions and milestones occur.

---

## Potential Future Additions & Considerations (Knowledge Service Frontend)
- **Upload UX:** Drag-and-drop, progress indicators, file type/size validation.
- **Search UX:** Pagination, advanced filters, highlighting, bulk actions.
- **Document Actions:** Preview, download, versioning, audit trail.
- **Bulk Operations:** Bulk delete, tag, download.
- **Collaboration:** Comments, annotations, approval workflow.
- **Permissions:** Role-based access, action visibility.
- **Integration:** API, real-time updates, external sources, export.
- **Accessibility:** Keyboard navigation, ARIA, localization.
- **LLM Playground Expansion:** Future versions will support agent personas, threads, and RAG data integration for advanced LLM workflows.

---

*This document is updated regularly as the DADMS project evolves. Reminders to update are set as part of the agent workflow.* 

## LLM Playground – Best Practices & Future Enhancements

1. **Prompt Templates**: Allow users to select/save common prompt templates.
2. **System/Instruction Prompts**: Field for system-level instructions (e.g., “You are a helpful assistant…”).
3. **Response Formatting Options**: Let users choose output format (plain text, markdown, JSON, etc.).
4. **Token/Cost Estimation**: Show estimated token usage and cost for each prompt.
5. **Streaming Responses**: Support streaming output for long completions.
6. **Context Window Preview**: Display context size and warn if near model limits.
7. **Thread/History Management**: View, continue, or branch from previous conversations.
8. **Context Injection**: Inject project/domain/tag knowledge or previous messages as context.
9. **Dynamic Model Capabilities**: Show model-specific features and disable unsupported options.
10. **Provider Health/Quota**: Display provider status, rate limits, or quota remaining.
11. **Key Source Transparency**: Clearly indicate which API key is in use.
12. **Data Privacy Notice**: Remind users about third-party provider data handling.
13. **Tool Calling UI**: Prepare UI for tool-calling and show available tools.
14. **Plugin/Extension Support**: Architect UI for easy addition of new providers/models/tools.
15. **Audit Trail**: Optionally log LLM interactions for auditability.
16. **Test Harness**: Provide a way to run regression tests on the playground.
17. **User Documentation/Help**: Inline help/tooltips and a link to playground documentation. 