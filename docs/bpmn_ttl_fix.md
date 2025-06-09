# Fixing Camunda BPMN "History Time To Live" Error

When deploying BPMN models to Camunda, you might encounter this error:

```
ENGINE-12018 History Time To Live (TTL) cannot be null. TTL is necessary for the History Cleanup to work.
```

## What is "History Time To Live"?

History Time To Live (TTL) is a Camunda feature that determines how long historical process data is retained before being eligible for cleanup. This is important for managing database size and performance over time.

## Solution

The `fix_bpmn_ttl.py` script automatically adds the `historyTimeToLive` attribute to all your BPMN process definitions:

```xml
<bpmn:process id="YourProcessId" name="Your Process Name" isExecutable="true" camunda:historyTimeToLive="30">
```

The default TTL value is set to 30 days, which means process history will be retained for 30 days before it can be cleaned up by Camunda's history cleanup job.

## How to Use the Fix

1. Run the fix script to update all BPMN files:

   ```
   python scripts/fix_bpmn_ttl.py
   ```

2. After fixing the BPMN files, deploy them using the deployment script:

   ```
   python scripts/deploy_bpmn.py -a -s http://localhost:8080
   ```

## Manual Fix

If you prefer to manually fix your BPMN files:

1. Open your BPMN file in a text editor
2. Find the `<bpmn:process>` element (usually near the top of the file)
3. Add the `camunda:historyTimeToLive="30"` attribute to the element
4. Save the file and deploy it to Camunda

## Adjusting the TTL Value

The default TTL value is set to 30 days. You can modify the script to change this value:

```python
add_history_ttl(file_path, ttl_days=60)  # Change to 60 days
```

Choose an appropriate TTL value based on your data retention requirements:
- Shorter TTL (7-14 days): Good for development environments or high-volume processes
- Medium TTL (30-90 days): Suitable for most business processes
- Longer TTL (180+ days): Use for processes with regulatory or compliance requirements
