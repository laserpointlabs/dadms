# MCP Integration for DADM

This document describes the Model Context Protocol (MCP) integration with the Decision Analysis and Decision Making (DADM) system, providing enhanced mathematical and analytical capabilities for decision processes.

## Overview

The MCP integration extends DADM with three specialized services that provide:

1. **Statistical Analysis Service** (Port 5201) - Advanced statistical computations
2. **Neo4j Graph Analytics Service** (Port 5202) - Graph-based analysis and network analytics  
3. **Script Execution Service** (Port 5203) - Safe execution of Python, R, and Scilab scripts

## Architecture

### Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DADM Core System                        │
├─────────────────────────────────────────────────────────────┤
│  • BPMN Workflow Engine (Camunda)                         │
│  • Service Registry & Discovery (Consul)                  │
│  • Orchestrator & Task Management                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 MCP Service Layer                          │
├─────────────────┬─────────────────┬─────────────────────────┤
│ Statistical     │ Neo4j Graph     │ Script Execution       │
│ Service         │ Analytics       │ Service                 │
│ (Port 5201)     │ (Port 5202)     │ (Port 5203)             │
├─────────────────┼─────────────────┼─────────────────────────┤
│ • Descriptive   │ • Centrality    │ • Python Scripts       │
│   Stats         │   Analysis      │ • R Statistical         │
│ • Hypothesis    │ • Community     │   Analysis              │
│   Testing       │   Detection     │ • Scilab Numerical      │
│ • Regression    │ • Path Analysis │   Computing             │
│ • Time Series   │ • Custom Cypher │ • Optimization          │
│                 │   Queries       │ • Monte Carlo           │
│                 │                 │   Simulation            │
└─────────────────┴─────────────────┴─────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 MCP Server Layer                           │
├─────────────────┬─────────────────┬─────────────────────────┤
│ MCP Statistical │ MCP Neo4j       │ MCP Script Execution    │
│ Server          │ Server          │ Server                  │
├─────────────────┼─────────────────┼─────────────────────────┤
│ • NumPy/SciPy   │ • Neo4j Driver  │ • Subprocess            │
│ • Scikit-learn  │ • NetworkX      │   Management            │
│ • Pandas        │ • Graph         │ • Security Sandbox     │
│                 │   Algorithms    │ • Multi-language        │
│                 │                 │   Support               │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### Data Flow

1. **BPMN Workflow** triggers mathematical analysis tasks
2. **DADM Orchestrator** routes tasks to appropriate MCP services
3. **MCP Services** wrap MCP servers and expose DADM-compatible endpoints
4. **MCP Servers** perform actual computations using specialized libraries
5. **Results** are returned through the service layer back to BPMN workflows

## Services Details

### Statistical Analysis Service (Port 5201)

**Capabilities:**
- Descriptive statistics (mean, median, std dev, percentiles)
- Hypothesis testing (normality tests, t-tests, ANOVA)
- Regression analysis (linear, polynomial)
- Time series analysis and forecasting
- Statistical modeling

**Endpoints:**
- `GET /health` - Health check
- `GET /info` - Service information and capabilities
- `POST /process_task` - Main analysis endpoint

**Example Usage:**
```json
{
  "task_name": "statistical_analysis",
  "task_description": "Analyze decision alternative performance",
  "variables": {
    "data": [85, 90, 88, 92, 87, 78, 82, 85, 80, 83],
    "analysis_type": "descriptive"
  }
}
```

### Neo4j Graph Analytics Service (Port 5202)

**Capabilities:**
- Graph metrics (node/edge counts, density)
- Centrality analysis (degree, betweenness, closeness, eigenvector)
- Community detection (Louvain, label propagation)
- Path analysis and shortest paths
- Custom Cypher query execution

**Example Usage:**
```json
{
  "task_name": "stakeholder_analysis",
  "task_description": "Analyze stakeholder influence network",
  "variables": {
    "operation": "calculate_centrality",
    "node_label": "Stakeholder",
    "limit": 10
  }
}
```

### Script Execution Service (Port 5203)

**Capabilities:**
- Safe Python script execution with sandboxing
- R statistical script execution
- Scilab numerical computation
- Function optimization using SciPy
- Monte Carlo simulation
- Configurable execution timeouts

**Example Usage:**
```json
{
  "task_name": "optimization",
  "task_description": "Optimize cost-benefit function",
  "variables": {
    "script": "def cost_function(x): return x[0]**2 + x[1]**2 + 5*x[0] + 3*x[1]",
    "language": "python",
    "data": {"constraints": []}
  }
}
```

## Installation & Setup

### Prerequisites

1. **Python 3.11+** with required packages
2. **Neo4j Database** (for graph analytics)
3. **R** (optional, for R script execution)
4. **Scilab** (optional, for Scilab scripts)

### Installation Steps

1. **Install Python Dependencies:**
   ```bash
   cd services/mcp_statistical_service
   pip install -r requirements.txt
   
   cd ../mcp_neo4j_service  
   pip install -r requirements.txt
   
   cd ../mcp_script_execution_service
   pip install -r requirements.txt
   ```

2. **Install R (Optional):**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install r-base r-base-dev
   
   # Windows: Download from https://cran.r-project.org/
   # macOS: brew install r
   ```

3. **Install R Packages:**
   ```r
   install.packages(c("ggplot2", "dplyr", "jsonlite", "forecast"))
   ```

4. **Configure Neo4j:**
   - Update Neo4j connection settings in service configurations
   - Default: `bolt://localhost:7687` with `neo4j/password`

### Running Services

#### Option 1: Manual Startup
```bash
# Terminal 1 - Statistical Service
cd services/mcp_statistical_service
python service.py

# Terminal 2 - Neo4j Service  
cd services/mcp_neo4j_service
python service.py

# Terminal 3 - Script Execution Service
cd services/mcp_script_execution_service
python service.py
```

#### Option 2: Service Manager (Recommended)
```bash
# Start all services
python scripts/mcp_service_manager.py start

# Check status
python scripts/mcp_service_manager.py status

# Run integration tests
python scripts/mcp_service_manager.py test

# Stop all services
python scripts/mcp_service_manager.py stop
```

#### Option 3: Docker Compose
```bash
cd docker
docker-compose -f docker-compose-with-mcp.yml up -d
```

## Testing

### Integration Tests

Run comprehensive tests to validate the MCP integration:

```bash
# Run all tests
python tests/mcp_integration_test.py

# Or use the service manager
python scripts/mcp_service_manager.py test
```

### Manual Testing

Test individual services:

```bash
# Health checks
curl http://localhost:5201/health
curl http://localhost:5202/health  
curl http://localhost:5203/health

# Service information
curl http://localhost:5201/info
curl http://localhost:5202/info
curl http://localhost:5203/info
```

## BPMN Integration

### Enhanced Decision Process

The MCP services integrate seamlessly with BPMN workflows through the enhanced decision process:

```xml
<!-- Example BPMN service task for statistical analysis -->
<bpmn:serviceTask id="StatisticalAnalysisTask" 
                  name="Analyze Decision Data" 
                  camunda:type="external" 
                  camunda:topic="AnalyzeDecisionData">
  <bpmn:extensionElements>
    <camunda:properties>
      <camunda:property name="service.type" value="analytics" />
      <camunda:property name="service.name" value="mcp-statistical-service" />
    </camunda:properties>
  </bpmn:extensionElements>
</bpmn:serviceTask>
```

### Parallel Analysis Streams

The enhanced workflow supports parallel analysis:

1. **Traditional Analysis** - OpenAI-powered qualitative analysis
2. **Statistical Analysis** - Quantitative statistical methods
3. **Graph Analysis** - Network and relationship analysis  
4. **Script-based Analysis** - Custom computational models

## Mathematical Models

### Included Examples

The integration includes several pre-built mathematical models:

1. **Multi-Criteria Decision Analysis** (`scripts/mathematical_models.py`)
   - Weighted scoring models
   - TOPSIS analysis
   - AHP (Analytic Hierarchy Process)

2. **Risk Assessment Models**
   - Monte Carlo risk simulation
   - Correlation analysis
   - VaR calculations

3. **Cost-Benefit Analysis**
   - NPV calculations with uncertainty
   - Sensitivity analysis
   - Real options valuation

4. **Stakeholder Analysis**
   - Influence network modeling
   - Power-interest matrices
   - Coalition analysis

### Adding Custom Models

Create new mathematical models by:

1. **Adding Python scripts** to `scripts/` directory
2. **Creating R functions** for statistical analysis
3. **Developing Scilab models** for numerical computation
4. **Integrating via MCP script execution service**

## Configuration

### Service Ports
- **Service Monitor**: 5200 (existing)
- **MCP Statistical Service**: 5201
- **MCP Neo4j Service**: 5202
- **MCP Script Execution Service**: 5203

### Environment Variables

```bash
# Statistical Service
SERVICE_PORT=5201
MCP_SERVER_PATH=/path/to/mcp_servers

# Neo4j Service  
SERVICE_PORT=5202
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

# Script Execution Service
SERVICE_PORT=5203
SANDBOX_MODE=true
MAX_EXECUTION_TIME=300
R_HOME=/usr/lib/R
SCILAB_PATH=/usr/local/scilab/bin/scilab
```

### Security Configuration

The script execution service includes security features:

- **Sandboxing**: Restricts file system access
- **Timeouts**: Prevents infinite loops
- **Resource limits**: Controls memory/CPU usage
- **Input validation**: Sanitizes script inputs

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure ports 5201-5203 are available
2. **MCP Server Startup**: Check Python path and dependencies
3. **Neo4j Connection**: Verify Neo4j is running and accessible
4. **R/Scilab Missing**: Install required software or disable features

### Logs and Debugging

```bash
# Check service logs
tail -f logs/mcp_statistical_service.log
tail -f logs/mcp_neo4j_service.log  
tail -f logs/mcp_script_execution_service.log

# Debug mode
export LOG_LEVEL=DEBUG
python service.py
```

### Health Monitoring

Monitor service health through:
- Health endpoints (`/health`)
- Service registry (Consul)
- Integration test results
- Application logs

## Performance Considerations

### Optimization Tips

1. **Statistical Service**: Cache frequent calculations
2. **Neo4j Service**: Use indexed queries and connection pooling
3. **Script Execution**: Implement result caching for expensive computations
4. **Resource Management**: Set appropriate timeouts and memory limits

### Scaling

- **Horizontal scaling**: Deploy multiple service instances
- **Load balancing**: Use nginx or similar for request distribution
- **Database optimization**: Tune Neo4j performance settings
- **Containerization**: Use Docker for consistent deployments

## Future Enhancements

### Planned Features

1. **Advanced Analytics**
   - Machine learning model integration
   - Time series forecasting
   - Optimization algorithms

2. **Visualization**
   - Chart generation services
   - Dashboard integration
   - Interactive plots

3. **Data Integration**
   - External data source connectors
   - Real-time data streaming
   - Data preprocessing pipelines

4. **Security Enhancements**
   - Enhanced sandboxing
   - User authentication
   - Audit logging

## Support

For technical support or questions:

1. Check the troubleshooting section
2. Review integration test results
3. Examine service logs
4. Consult the DADM documentation

## Contributing

To contribute to the MCP integration:

1. Follow the established service patterns
2. Add comprehensive tests
3. Update documentation
4. Ensure security best practices
