# Changelog

## [2.0.0-alpha.2] - 2025-07-17

### Added
- **Complete Architecture Rebuild**: DADMS 2.0 with clean microservices architecture
- **Enhanced AASCar Component**: Added user input functionality for Agent Assistance & Documentation Service
- **AASD Configuration**: Updated configuration page and enhanced project management settings
- **Comprehensive Documentation**: Expanded README with AASD workflow and UI/UX details
- **Navigation Enhancement**: Added AASD (Finalize Decision) link in RootLayout
- **Microservices Foundation**: Prepared structure for user-project, knowledge, and LLM services
- **Docker Infrastructure**: Complete setup with PostgreSQL, Qdrant, and Redis
- **Turborepo Integration**: Monorepo build system with workspace packages

### Changed
- **Architecture**: Complete migration from monolithic to microservices architecture
- **Technology Stack**: Upgraded to Node.js 18+, TypeScript, React 18
- **Database**: Enhanced schema with decision_context field for richer project metadata
- **Build System**: Migrated to Turborepo for better monorepo management

### Fixed
- Shell/SQL quoting issues for JSONB fields during demo data insertion
- Established consistent model/schema change propagation process

## [2.0.0-alpha.1] - Previous Release
### Added
- Initial DADMS 2.0 foundation with clean architecture
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