# LLM + MCP BPMN Workflow Overview

This guide summarizes how to build BPMN processes that combine the LLM services with MCP servers using the existing pipeline service.  It highlights the main documentation locations and shows where to find test scripts for each service.

## 1. Pipeline Service Concept

The `LLM-MCP Pipeline Service` (`services/llm_mcp_pipeline_service`) orchestrates an interaction between an LLM (OpenAI service) and the MCP servers.  Instead of modelling many individual tasks, you can call the pipeline service as a single BPMN service task.

- **Service Endpoint:** `http://localhost:5204/process_task`
- **Predefined Pipelines:** decision_analysis, stakeholder_analysis, optimization_analysis
- **Custom Pipelines:** specify `llm_config`, `mcp_config`, tools and output format in the task variables.

See `docs/LLM_MCP_PIPELINE_SERVICE_USAGE.md` for complete usage details.

## 2. BPMN Modelling Pattern

When creating a BPMN model, configure a service task to call the pipeline service:

```xml
<bpmn:serviceTask id="AnalysisTask" name="Decision Analysis" camunda:type="external" camunda:topic="ProcessDecisionAnalysis">
  <bpmn:extensionElements>
    <camunda:properties>
      <camunda:property name="service.type" value="pipeline" />
      <camunda:property name="service.name" value="llm-mcp-pipeline" />
      <camunda:property name="pipeline.name" value="decision_analysis" />
    </camunda:properties>
  </bpmn:extensionElements>
</bpmn:serviceTask>
```

The process variables provide the data to analyse.  The pipeline service calls the selected MCP service, then passes the results to the LLM service for interpretation.  The final result is returned to Camunda in a format compatible with the orchestrator.

Detailed examples of BPMN processes can be found in `camunda_models/` and `examples/bpmn/`.

## 3. Where to Start

1. Read `docs/LLM_MCP_PIPELINE_SERVICE_USAGE.md` for pipeline configuration options and BPMN snippets.
2. Review `docs/README_simple_mcp_demo_process.md` for a complete walkthrough of a demo process.
3. See `docs/CAMUNDA_DADM_INTEGRATION_PATTERNS.md` for different ways to integrate DADM services into your Camunda models.

## 4. Service Test Scripts

The repository provides helper scripts to test each service individually.  They are located under the `scripts/` directory.

| Service | Test Script | Purpose |
|---------|-------------|---------|
| OpenAI Assistant | `scripts/debug_openai_service.py` | Send a test task directly to the OpenAI service and inspect the response |
| MCP Statistical Service | `scripts/test_statistical_service.py` | Verify the enhanced statistical service with sample data |
| MCP Neo4j Service | `scripts/mcp_integration_test.py` | Includes graph analysis tests via `/process_task` |
| MCP Script Execution Service | `scripts/mcp_integration_test.py` | Executes sample scripts and mathematical models |
| Pipeline Service | `scripts/test_pipeline_service.py` | Exercise health, info and pipeline execution endpoints |

Run these scripts with Python while the services are running (usually via Docker Compose).  They print detailed output so you can see how each service behaves.

## 5. Next Steps

1. Start the services with `docker-compose -f docker/docker-compose.yml up -d`.
2. Deploy BPMN models from `camunda_models/` using `python scripts/deploy_bpmn.py --all`.
3. Execute `python scripts/test_pipeline_service.py` to verify the pipeline service.
4. Use the example process models as a starting point for your own workflows.

These resources should help you experiment with LLM + MCP pipelines and build higher‑level decision processes on top of them.
