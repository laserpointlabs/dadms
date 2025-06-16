# DADM Analysis Script Registry Service

## 🎯 **Architecture Overview**

The Analysis Script Registry Service provides a **flexible, decoupled solution** for managing and executing analysis scripts, similar to your prompt service but for computational analysis.

### **Key Features:**
✅ **Multiple Script Sources** - Local files, Git repos, remote servers, direct content  
✅ **JSON Schema Validation** - Input/output schemas for each script  
✅ **Swagger Documentation** - Auto-generated API docs for testing  
✅ **BPMN Integration Ready** - Context metadata preservation  
✅ **Flexible Execution** - Python, remote APIs, and more  
✅ **Easy Script Management** - Add scripts without touching service code  

---

## 🔄 **Two-Step BPMN Flow**

### **Step 1: LLM Data Formatting** (Service Task)
```xml
<bpmn:serviceTask id="FormatForAnalysis" name="Format Data for Analysis" 
                  camunda:type="external" camunda:topic="format-for-analysis">
  <bpmn:extensionElements>
    <camunda:properties>
      <camunda:property name="service.type" value="assistant" />
      <camunda:property name="service.name" value="dadm-openai-assistant" />
      <camunda:property name="instruction.type" value="analysis_template" />
      <camunda:property name="instruction.template_id" value="adder" />
    </camunda:properties>
  </bpmn:extensionElements>
</bpmn:serviceTask>
```

**LLM Output:**
```json
{
  "analysis_template": "adder",
  "item1": 75000,
  "item2": 25000,
  "context_metadata": {
    "service_task_name": "FormatForAnalysis",
    "process_instance_id": "proc_123",
    "thread_id": "thread_456"
  }
}
```

### **Step 2: Script Execution** (Service Task)
```xml
<bpmn:serviceTask id="ExecuteAnalysis" name="Execute Analysis Script"
                  camunda:type="external" camunda:topic="execute-analysis">
  <bpmn:extensionElements>
    <camunda:properties>
      <camunda:property name="service.type" value="analysis_script" />
      <camunda:property name="service.name" value="dadm-analysis-script-registry" />
    </camunda:properties>
  </bpmn:extensionElements>
</bpmn:serviceTask>
```

**Script Output:**
```json
{
  "service_task_name": "ExecuteAnalysis",
  "instructions": "Successfully added 75000 + 25000 using simple arithmetic",
  "result": 100000,
  "operation": "addition",
  "confidence": 1.0,
  "details": {
    "formula": "75000 + 25000 = 100000",
    "operands": [75000, 25000],
    "execution_time": 0.0001
  },
  "execution_metadata": {
    "script_id": "adder",
    "script_version": "1.0",
    "execution_timestamp": "2025-06-16T17:27:09.034025",
    "execution_duration": 0.0001,
    "context_preserved": true
  }
}
```

---

## 📊 **Available Analysis Scripts**

### **1. Simple Addition (`adder`)**
- **Source**: Local Python file
- **Input**: Two numbers + context metadata
- **Output**: Sum with execution details
- **Use Case**: Basic arithmetic operations in workflows

### **2. Sensitivity Analysis (`sensitivity_analysis`)**
- **Source**: Local Python file  
- **Input**: Decision alternatives, criteria, weights
- **Output**: Sensitivity analysis with stability recommendations
- **Use Case**: Decision robustness analysis

### **3. Remote Scilab Connector (`remote_scilab_connector`)**
- **Source**: Remote server API
- **Input**: Scilab script + input data
- **Output**: Engineering analysis results
- **Use Case**: Complex mathematical/engineering computations

### **4. Git Python Script (`git_python_script`)**
- **Source**: Git repository
- **Input**: Dataset + regression parameters
- **Output**: Statistical analysis results
- **Use Case**: Data science workflows with version-controlled scripts

---

## 🔧 **Service Endpoints**

### **Script Management**
- `GET /scripts` - List available scripts (with filtering)
- `GET /scripts/{script_id}` - Get script details
- `GET /scripts/{script_id}/schema` - Get input/output schemas
- `GET /categories` - List script categories
- `GET /source-types` - List source types

### **Execution**
- `POST /execute` - Execute script with input data
- `POST /validate` - Validate input without execution
- `POST /bpmn/execute` - BPMN-optimized execution endpoint

### **Monitoring**
- `GET /health` - Health check
- `GET /statistics` - Registry statistics
- `GET /docs` - Swagger documentation

---

## 🚀 **Service URL**

The service is running at: **http://localhost:8004**

**Swagger Documentation**: http://localhost:8004/docs

---

## 💡 **Benefits of This Architecture**

1. **Decoupled Scripts** - Analysis logic separate from service code
2. **Multiple Sources** - Local files, Git repos, remote servers
3. **Easy Management** - Add/update scripts without service changes
4. **Schema Validation** - Automatic input/output validation
5. **BPMN Ready** - Context metadata preservation for workflows
6. **Testing Friendly** - Swagger interface for script testing
7. **Scalable** - Can reference multiple analysis servers
8. **Flexible** - Supports any programming language/platform

---

## 🔄 **Next Steps**

1. **Test via Swagger** - Use http://localhost:8004/docs to test scripts
2. **Create More Scripts** - Add your specific analysis needs
3. **BPMN Integration** - Update Service Orchestrator for new service type
4. **Remote Servers** - Set up Scilab/R analysis servers
5. **Git Integration** - Create analysis script repositories

This architecture gives you the **flexible, manageable analysis system** you envisioned! 🎉
