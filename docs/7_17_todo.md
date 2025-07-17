# DADMS 2.0 – 7/17 TODO

## 1. Complete UI Scaffolding (Morning)
- [ ] Finalize Project Dashboard UI (cards, create/edit, context field)
- [ ] Polish Knowledge Page UI (document upload, search, placeholder results)
- [ ] Refine Domain/Tag Management UIs (multi-select, add/edit, local state)
- [ ] Add sidebar navigation for new pages (AASD, Process, Thread)
- [ ] Ensure all forms and lists use consistent Material-UI components

## 2. UI Validation & Feedback
- [ ] Walk through all main flows (project, knowledge, process, thread, AASD)
- [ ] Note any UX issues, missing elements, or confusing interactions
- [ ] Capture feedback for quick fixes before backend integration

## 3. Backend Kickoff (Afternoon)
- [ ] Scaffold backend service structure (Project, Knowledge, Domain/Tag)
- [ ] Define initial TypeScript types/models for core entities
- [ ] Set up basic Express (or chosen framework) app with health check
- [ ] Draft OpenAPI spec for Project and Knowledge endpoints (CRUD, search)
- [ ] Prepare database schema migration files (Postgres) for Project, Domain, Tag, Document

## 4. Integration Prep
- [ ] Plan API integration points in the frontend (replace local state with API calls)
- [ ] Add TODOs/comments in UI code for where to connect backend
- [ ] Document any assumptions or open questions for tomorrow’s work

## 5. Documentation & Process
- [ ] Update the development process doc with today’s decisions and lessons
- [ ] Summarize progress and blockers at end of day 

## 6. AAS UI Scaffolding
- [ ] Scaffold AAS Configuration Page (view/edit AAS settings, agent/persona selection, oversight level)
- [ ] Add bottom popup "AAS Car" to main UI with tabs: Errors, Info, AAS
- [ ] Implement adjustable height for the car (drag handle or similar)
- [ ] Add hide/show button for the car
- [ ] Ensure tabs are horizontally split and user can interact with each 