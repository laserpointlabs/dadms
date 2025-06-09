# DADM Test Files

This directory contains unit tests for the DADM project. Old experimental tests
have been removed to keep the suite lightweight and focused on the current
implementation.

## Active Test Files

The following test files are maintained and run as part of the default test
suite:

- `test_assistant_manager.py` - basic checks for the `AssistantManager` class
- `test_cloud_provider_decision_fixed.py` - tests cloud provider decision logic
- `test_enhanced_orchestrator.py` - performance tests for the orchestrator
- `test_orchestrator_minimal.py` - lightweight tests for `ServiceOrchestrator`

## Running Tests

To run all tests:

```bash
python -m unittest discover -s tests
```

Some tests are skipped if required environment variables such as
`OPENAI_API_KEY` are not set.

## Adding New Tests

When adding new tests:

1. Follow the naming convention `test_*.py`
2. Include a docstring explaining the purpose of the test
3. Use the `unittest` framework for compatibility
4. Add appropriate setup and teardown methods
5. Document any required environment variables or configuration
