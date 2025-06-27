# PM2 Cluster Mode Issue - Solution Document

## Problem Description

The DADM backend was automatically running in cluster mode instead of the intended fork mode, despite being configured for single instance deployment in the `ecosystem.config.js` file.

### Symptoms
- PM2 process list showed `mode: cluster` instead of `mode: fork`
- Higher memory usage than expected (63.9mb vs 20.8mb in fork mode)
- Process was running as if it had multiple instances capability

### Observed Behavior
```bash
pm2 list
┌────┬─────────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                    │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼─────────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ dadm-backend            │ default     │ 1.0.0   │ cluster │ 1417     │ 94s    │ 0    │ online    │ 0%       │ 63.9mb   │ jdehart  │ disabled │
└────┴─────────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

## Root Cause Analysis

### Why This Happens

1. **PM2 Default Behavior**: PM2 defaults to cluster mode for Node.js applications when certain conditions are met, even if `instances: 1` is specified.

2. **Missing Explicit Mode Declaration**: The original `ecosystem.config.js` configuration did not explicitly declare the execution mode:
   ```javascript
   {
       name: 'dadm-backend',
       script: 'cli-api-server.js',
       instances: 1,  // This alone doesn't guarantee fork mode
       // Missing: exec_mode: 'fork'
   }
   ```

3. **PM2 Interpretation**: When PM2 encounters a Node.js application without explicit `exec_mode`, it may choose cluster mode based on:
   - Node.js version
   - Application type detection
   - System resources
   - Previous PM2 state/cache

4. **Process Persistence**: Once a process is started in cluster mode, PM2 remembers this configuration even after restarts unless explicitly reset.

## Technical Details

### PM2 Execution Modes

PM2 supports two primary execution modes:

1. **Fork Mode** (`exec_mode: 'fork'`)
   - Single process instance
   - Lower memory footprint
   - Simpler debugging
   - Direct process execution
   - Recommended for single-instance applications

2. **Cluster Mode** (`exec_mode: 'cluster'`)
   - Multiple worker processes
   - Built-in load balancing
   - Higher memory usage
   - Automatic process scaling
   - Recommended for high-traffic applications

### Memory Usage Comparison
- **Cluster Mode**: 63.9mb (with overhead for cluster management)
- **Fork Mode**: 20.8mb (single process, minimal overhead)

## Solution Implementation

### Step 1: Stop and Clean Current Process
```bash
# Stop the backend process
pm2 stop dadm-backend

# Delete the process to clear PM2's memory of its configuration
pm2 delete dadm-backend
```

### Step 2: Update Ecosystem Configuration

Modify `/home/jdehart/dadm/ui/ecosystem.config.js` to explicitly specify fork mode:

```javascript
module.exports = {
    apps: [
        {
            name: 'dadm-backend',
            script: 'cli-api-server.js',
            cwd: '/home/jdehart/dadm/ui',
            instances: 1,
            exec_mode: 'fork',  // ← ADD THIS LINE
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            // ... rest of configuration
        }
    ]
};
```

### Step 3: Restart with Updated Configuration
```bash
# Navigate to the UI directory
cd /home/jdehart/dadm/ui

# Start the backend with the updated ecosystem configuration
pm2 start ecosystem.config.js --only dadm-backend
```

### Step 4: Verify the Fix
```bash
# Check that the process is now running in fork mode
pm2 list

# Expected output should show "fork" in the mode column:
# │ 3  │ dadm-backend  │ default │ 1.0.0 │ fork │ 2759 │ 0s │ 0 │ online │ 0% │ 20.8mb │ jdehart │ disabled │
```

## Prevention Strategies

### 1. Always Specify Execution Mode
Never rely on PM2's default behavior. Always explicitly set `exec_mode`:

```javascript
{
    name: 'my-app',
    script: 'app.js',
    instances: 1,
    exec_mode: 'fork',  // Always specify this
}
```

### 2. Use Configuration Validation
Add a validation script to check ecosystem configuration:

```javascript
// validate-ecosystem.js
const config = require('./ecosystem.config.js');

config.apps.forEach(app => {
    if (!app.exec_mode) {
        console.warn(`⚠️  App "${app.name}" missing exec_mode - PM2 will use default behavior`);
    }
    if (app.instances === 1 && app.exec_mode === 'cluster') {
        console.warn(`⚠️  App "${app.name}" uses cluster mode with 1 instance - consider fork mode`);
    }
});
```

### 3. Environment-Specific Configurations
Consider different modes for different environments:

```javascript
{
    name: 'dadm-backend',
    script: 'cli-api-server.js',
    instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
    exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',
}
```

### 4. Regular Monitoring
Monitor PM2 processes regularly:

```bash
# Check process modes
pm2 list

# Get detailed process information
pm2 describe <process-name>

# Monitor resource usage
pm2 monit
```

## When to Use Each Mode

### Use Fork Mode When:
- Single instance is sufficient
- Application is not CPU-intensive
- Debugging is important
- Memory usage needs to be minimized
- Simple deployment is preferred

### Use Cluster Mode When:
- High availability is required
- Application is CPU-intensive
- Load balancing is needed
- Scaling across CPU cores is beneficial
- Production environment with high traffic

## Best Practices

1. **Explicit Configuration**: Always specify `exec_mode` in ecosystem files
2. **Environment Awareness**: Use different configurations for development and production
3. **Resource Monitoring**: Regularly check memory and CPU usage
4. **Documentation**: Document the reasoning behind mode selection
5. **Testing**: Test applications in both modes during development

## Troubleshooting Commands

```bash
# Check current PM2 processes and their modes
pm2 list

# Get detailed information about a specific process
pm2 describe <process-name>

# View process logs
pm2 logs <process-name>

# Reset PM2 completely (if needed)
pm2 kill
pm2 resurrect

# Save current PM2 configuration
pm2 save

# Reload ecosystem configuration
pm2 reload ecosystem.config.js
```

## Conclusion

The cluster mode issue was caused by PM2's default behavior when `exec_mode` is not explicitly specified. By adding `exec_mode: 'fork'` to the ecosystem configuration and restarting the process, we ensure predictable behavior and optimal resource usage for single-instance applications.

This solution provides:
- ✅ Predictable execution mode
- ✅ Reduced memory usage (from 63.9mb to 20.8mb)
- ✅ Simplified debugging
- ✅ Explicit configuration management

---
**Document Version**: 1.0  
**Created**: June 19, 2025  
**Last Updated**: June 19, 2025  
**Author**: DADM Development Team
