# DADM Test Files

This directory contains various test files for the DADM project. During the cleanup process, some test files have been removed, fixed, or marked as deprecated.

## Active Test Files

The following test files are currently maintained and should be used for testing:

- `test_cloud_provider_decision_fixed.py` - Tests for cloud provider decision workflow
- `test_enhanced_orchestrator.py` - Tests for the EnhancedServiceOrchestrator

## Deprecated Test Files

The following test files have been marked as deprecated but are kept for reference:

- `test_openai_service.py` - Tests for the OpenAI Assistant Service (requires Flask)
- `test_service_orchestrator.py` - Tests for the ServiceOrchestrator (has failing tests)
- `test_assistant_api.py.deprecated` - Tests for the OpenAI Assistant API (uses outdated API endpoints)

## Removed Test Files

Several redundant or broken test files have been removed during the cleanup process. For details, see the [CLEANUP_SUMMARY.md](../docs/CLEANUP_SUMMARY.md) document.

## Running Tests

To run a specific test file:

```bash
python -m unittest tests/test_cloud_provider_decision_fixed.py
```

To run all tests:

```bash
python -m unittest discover -s tests
```

Note that some tests will be skipped if required environment variables are not set, such as `OPENAI_API_KEY`.

## Adding New Tests

When adding new tests:

1. Follow the naming convention `test_*.py`
2. Include a docstring explaining the purpose of the test
3. Use `unittest` framework for compatibility
4. Add appropriate setup and teardown methods
5. Document any required environment variables or configuration