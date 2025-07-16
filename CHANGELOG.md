# Changelog

## [Unreleased]
### Added
- Added `decision_context` field to the project model for richer project metadata and context-aware decision analysis.
- Updated database schema (`projects` table) to include `decision_context` column.
- Updated backend TypeScript types, service, controller, and validation logic to support the new field.
- Updated frontend types, project creation form, and project card display to include and show the `decision_context` field.
- Ensured OpenAPI/Swagger documentation and API responses include the new field.
- Added demo project with populated `decision_context` for end-to-end testing and UI visibility.

### Fixed
- Documented and resolved shell/SQL quoting issues for JSONB fields during demo data insertion by using SQL files and Podman commands.
- Established best practice: all model/schema changes must be propagated through database, backend, frontend, API docs, and demo/seed data, and documented in the development process.

## [Unreleased] – YYYY-MM-DD

### Added
- **BPMN Workspace**: New page at `/bpmn` in the UI, embedding `comprehensive_bpmn_modeler.html` via iframe for BPMN process design.
- **Model State Management**: Save/Load buttons in the workspace use localStorage and postMessage for BPMN XML persistence (MVP, no backend yet).
- **Sidebar Navigation**: Added "BPMN Workspace" link to the main sidebar for easy access.
- **Documentation**: Updated `docs/dadms_development_process.md` with a new section on BPMN Workspace future enhancements (backend persistence, project-scoped models, advanced integration, collaboration, etc.).

### Changed
- N/A

### Fixed
- N/A

---

🍻 Time to celebrate! Let's get a beer. 