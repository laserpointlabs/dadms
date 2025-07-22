# Changelog

## [2.0.0-alpha.3] - 2025-01-15

### Added
- **Enhanced UI Scaffolding**: Major improvements to frontend navigation and project management
  - **DADMS-Specific Activity Bar**: Replaced generic VS Code icons with direct navigation to DADMS tools
  - **Project Tree View**: Hierarchical explorer showing projects and associated objects (ontologies, knowledge, models, simulations, etc.)
  - **Project-Centric Navigation**: All DADMS tools now directly accessible from the activity bar
  - **Object Organization**: Logical folder structure for different project object types
  - **Status Indicators**: Visual status badges for project objects (active, draft, completed)
  - **Interactive Tree Controls**: Expand/collapse, refresh, and action buttons
- **Enhanced TypeScript Types**: Comprehensive type definitions for project objects and tree nodes
- **Improved Accessibility**: Proper ARIA labels, keyboard navigation, and screen reader support
- **VS Code-Inspired Styling**: Enhanced CSS with project tree view and improved activity bar styling

### Changed
- **Navigation Architecture**: Moved from sidebar-based navigation to activity bar-based navigation
- **Explorer Panel**: Now dedicated to project tree view instead of general navigation
- **Activity Bar Items**: Replaced generic VS Code icons (files, search, debug, etc.) with DADMS-specific tools
- **Layout Structure**: Enhanced component organization and improved state management

### Technical Details
- **New Components**: `ProjectTreeView.tsx` with comprehensive tree navigation
- **Enhanced Layout**: Updated `layout.tsx` with DADMS-specific activity bar implementation
- **CSS Improvements**: Added 200+ lines of tree view styling and enhanced VS Code theme integration
- **Type Safety**: Added interfaces for `ProjectObject`, `TreeNode`, and enhanced navigation types

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