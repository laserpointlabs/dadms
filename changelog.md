# Changelog

All notable changes to the DADM Demonstrator project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.8.0] - 2025-06-05

### Added
- PostgreSQL database migration for Camunda platform
- Enhanced Docker configurations with proper PostgreSQL authentication
- Database readiness checking with wait-for-it script in Camunda container
- PostgreSQL JDBC driver version 42.7.4 for improved connectivity
- Comprehensive health checks for all database services
- Alpine Linux package management fixes for Camunda container

### Changed
- Migrated from H2 to PostgreSQL database for Camunda
- Updated PostgreSQL authentication methods (trust for local, MD5 for host)
- Enhanced Camunda Dockerfile with proper Alpine package manager (apk)
- Improved container startup reliability and dependency management
- Updated database connection configurations across all services

### Fixed
- Resolved VARCHAR(4000) limitations by migrating to PostgreSQL
- Fixed Camunda container package installation issues
- Improved database connection stability and error handling
- Enhanced container health monitoring and recovery

### Security
- Implemented proper PostgreSQL authentication configuration
- Enhanced database security with MD5 authentication for host connections

## [0.7.0] - 2025-05-29

### Added
- Enhanced JSON recommendation expansion functionality in Neo4j data persistence
- Added dynamic relationship naming using JSON keys as descriptive relationship names
- Added hierarchical node structure creation for complex UAV specifications and attributes
- Added recursive processing of nested dictionaries and lists in LLM responses
- Added proper handling of list items with index tracking and clear associations

### Changed
- Improved `_expand_recommendation_json` method to use JSON structure for relationship names
- Enhanced graph database representation with descriptive relationships (e.g., "ANALYSIS", "STAKEHOLDERS", "KEY_SPECIFICATIONS")
- Updated Neo4j node creation to maintain clear parent-child relationships throughout hierarchy
- Modified relationship creation to use "_ITEM" and "_VALUE" suffixes for better clarity

### Fixed
- Fixed generic relationship naming in Neo4j graph expansion
- Improved traceability from task nodes through analysis nodes to specific UAV entities
- Enhanced graph query capabilities with more meaningful relationship structures

## [0.6.0] - 2025-05-28

### Added
- Added comprehensive service monitoring system with automatic recovery capabilities
- Added health endpoints (/health, /status) to all services for unified monitoring
- Added Docker container management in service monitor for automated restarts
- Added detailed README files for monitor service and OpenAI service
- Added service configuration validation to prevent startup with invalid settings
- Added missing requirements.txt files for service-specific dependencies

### Changed
- Improved Docker configurations with proper environment variables and volume mounts
- Enhanced Dockerfile configurations for better dependency management
- Updated logging formats for consistent information across services
- Standardized health endpoint responses across all services
- Improved service initialization with better error handling

### Fixed
- Fixed Docker container exit issues with proper entrypoint configuration
- Resolved Consul registration issues for services
- Fixed service restart logic to properly handle failed services
- Improved error handling in service initialization to prevent silent failures
- Fixed assistant ID verification process in OpenAI service

## [0.5.0] - 2025-05-21

### Added
- Added improved workflow completion detection mechanism with clear priority ordering
- Added global process instance tracking for better workflow state awareness
- Added intelligent handling of multi-task workflows

### Changed
- Enhanced task handling to provide better progress information
- Improved worker initialization with proper delays for task discovery
- Optimized the application startup sequence to prevent premature termination

### Fixed
- Fixed workflow completion detection to properly wait for all tasks instead of timing out
- Fixed idle timeout issues that caused premature workflow termination
- Improved reliability with complex multi-task workflows like the OpenAI Decision Process
- Resolved race conditions in completion detection

## [0.4.0] - 2025-05-17

### Added
- Reorganized helper scripts into dedicated directory
- Created proper Python package structure with setup.py
- Added comprehensive installation verification scripts
- Added automated setup scripts for Windows and Linux/macOS

### Changed
- Updated requirements.txt with pinned package versions
- Improved documentation and README
- Standardized project structure following Python best practices

### Fixed
- Fixed path references in scripts to work from any location
- Resolved installation issues with proper package structure

## [0.3.0] - 2025-05-16 15:45:00

### Added
- Added OpenAI Assistant integration with file upload capabilities
- Implemented UAS selection decision process workflow
- Created diagnostic tools for checking OpenAI API integration

### Fixed
- Fixed OpenAI Assistant creation API compatibility issue
- Updated API parameter handling to match current OpenAI specifications

## [0.2.0] - 2025-05-15 14:30:00

### Added
- Added ability to start a process by name via command line
- Added command-line argument parsing with argparse
- Added support for passing initial variables to started processes
- Added flexible timeout configuration via command line
- Added monitor-only mode

## [0.1.0] - 2025-05-14 19:15:00

### Added
- Initial project structure creation with src, config, and tests directories
- Basic test scaffolding
- Camunda external task worker configuration
- Dynamic topic discovery from Camunda REST API
- Task handling with input/output variable display
- Automated task completion detection and application exit
- Added DECISION_CONTEXT variable for the first task with UAS selection scenario data

### Changed
- Implemented major architectural improvements to the application:
  - Consolidated all functionality into a single app.py file
  - Replaced modular task handler system with direct implementation
  - Integrated discovery functionality directly into the main application
- Enhanced the topic discovery mechanism:
  - Added XML parsing to extract topics directly from process definition files
  - Implemented continuous monitoring for new topics via background thread
  - Created a two-tier topic system (active topics and potential topics)
- Improved execution flow visualization:
  - Added 5-second delay between processing tasks for better workflow observation
  - Enhanced console output with detailed status updates
  - Added comprehensive task completion feedback
- Changed application behavior from exit-on-empty to continuous monitoring:
  - Application now waits for tasks to become available instead of exiting
  - Implemented polling system to check for new active tasks
  - Added proper idle detection and graceful termination

### Fixed
- Fixed critical workflow execution issues:
  - Resolved the problem where application only processed one task and then exited
  - Implemented reliable task completion detection
  - Added proper handling of multiple tasks with the same topic
  - Improved error handling for Camunda API interactions
- Implemented robust thread management:
  - Added proper thread synchronization
  - Ensured clean application shutdown
  - Fixed issues with thread termination

### Removed
- Task handler registry system (removed task_handlers directory)
- External Camunda discovery module (removed camunda_discovery.py)
- Removed unnecessary complexity by centralizing all functionality
- Eliminated all hardcoded topic defaults, replacing with dynamic discovery from BPMN XML

### Security
- Implemented proper timeout mechanisms to prevent indefinite hanging
- Added safeguards against thread leaks
- Protected application from network/API failures

### Next Steps

The DADM Demonstrator application now has a solid foundation with functional OpenAI Assistant integration. Future work will focus on:

1. **Service-Oriented Architecture** - Refactoring the application to use a microservices approach where individual services handle specific tasks in the workflow.
2. **Multiple Assistant Services** - Developing specialized assistants for different types of decision analysis tasks.
3. **Extended Tool Integration** - Adding coding and data analysis capabilities to the assistants.
4. **Vector Store and Neo4j Logging** - Adding comprehensive logging of all interactions to both vector store and graph database.
5. **Error Handling Enhancements** - Building more resilient error handling and recovery mechanisms.
6. **Testing Framework** - Creating comprehensive unit and integration tests.

### Notes

- Last updated: May 16, 2025, 15:45:00
- OpenAI Assistant integration has been successfully tested with the Camunda BPMN engine running the full UAS selection decision process.