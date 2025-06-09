# BPMN File Validation and Deployment

This document explains how to validate, fix, and deploy BPMN process models to Camunda.

## Common BPMN Issues

When working with BPMN files in Camunda, you might encounter the following common issues:

1. **Missing implementation attributes on service tasks**
   - Error: `One of the attributes 'class', 'delegateExpression', 'type', or 'expression' is mandatory on serviceTask`
   - For external tasks, both `camunda:type="external"` and `camunda:topic="topic_name"` are required

2. **Missing timer definitions on timer events**
   - Error: `No timerEventDefinition found for timer event`

3. **Invalid expressions in conditional flows**
   - Error: `No condition expression found for conditional sequence flow`

## Validation Scripts

DADM provides several scripts to help validate and fix BPMN files:

### Validate BPMN Files

Use the `validate_bpmn.py` script to check for common issues:

```bash
# Validate a specific BPMN file
python scripts/validate_bpmn.py --model camunda_models/your_model.bpmn

# Validate all BPMN files in the models directory
python scripts/validate_bpmn.py --all
```

The validator will report any issues it finds, such as missing implementation attributes.

### Fix BPMN Files

Use the `fix_bpmn.py` script to automatically fix common issues:

```bash
# Fix a specific BPMN file
python scripts/fix_bpmn.py --model camunda_models/your_model.bpmn

# Fix all BPMN files in the models directory
python scripts/fix_bpmn.py --all
```

The fixer will:
- Add `camunda:type="external"` and appropriate topic names to service tasks
- Create backups of your files before making changes

### Combined Check and Deploy

For the most efficient workflow, use the combined validation, fixing, and deployment script:

```bash
# On Windows
scripts\check_and_deploy_bpmn.bat --all

# On Linux/macOS
./scripts/check_and_deploy_bpmn.sh --all
```

This script will:
1. Validate your BPMN files
2. Fix any issues automatically
3. Deploy the fixed files to Camunda

Options:
```
Usage: check_and_deploy_bpmn.sh [options]

Options:
  -a, --all                Deploy all BPMN models
  -m, --model FILENAME     Deploy a specific BPMN model
  -s, --server URL         Camunda server URL (default: http://localhost:8080)
  --skip-validation        Skip validation step
  --skip-fix               Skip automatic fixing step
  --skip-deploy            Skip deployment step (validate and fix only)
  -h, --help               Display this help message
```

## Best Practices for BPMN Service Tasks

When creating service tasks in your BPMN files, follow these best practices:

1. **Always specify the implementation type**
   ```xml
   <bpmn:serviceTask id="TaskName" name="Task Name" camunda:type="external" camunda:topic="task_topic">
   ```

2. **Use consistent topic naming**
   - For DADM services, use the pattern: `service_function_task`
   - Examples: `echo_task`, `openai_task`

3. **Include the necessary service properties**
   ```xml
   <bpmn:extensionElements>
     <camunda:properties>
       <camunda:property name="service.type" value="test" />
       <camunda:property name="service.name" value="echo" />
     </camunda:properties>
   </bpmn:extensionElements>
   ```

4. **Validate before deployment**
   - Always run the validator before deploying to Camunda
   - Use the combined script for the most efficient workflow

By following these practices, you'll minimize deployment errors and ensure your processes work correctly with DADM's service orchestration system.