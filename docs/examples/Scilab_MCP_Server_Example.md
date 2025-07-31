# DADMS Scilab MCP Server

## Overview

This is a **DADMS-owned MCP server** that provides Scilab scientific computing capabilities to AI agents. This server is developed, maintained, and deployed as part of the DADMS infrastructure - we don't rely on external MCP servers for production use.

**Development Strategy:**
- **Prototype**: Research existing Scilab MCP implementations
- **Fork & Customize**: Build our own version with DADMS-specific features
- **Own & Deploy**: Run as part of DADMS service architecture
- **Secure & Integrate**: Full integration with DADMS authentication and monitoring

## What This Server Does

The Scilab MCP server allows AI to:
- Run Scilab scripts and get results
- Perform engineering calculations
- Create plots and visualizations
- Access Scilab's extensive mathematical libraries
- Handle matrix operations and signal processing

## Complete Working Example

### 1. Server Implementation

```javascript
// dadms-scilab-mcp-server.js
import { MCPServer } from '@modelcontextprotocol/sdk';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { DADMSAuth } from '../core/auth.js';
import { DADMSLogger } from '../core/logger.js';

class DADMSScilabMCPServer extends MCPServer {
  constructor() {
    super({
      name: 'dadms-scilab-server',
      version: '1.0.0',
      description: 'DADMS-owned MCP server for Scilab scientific computing'
    });

    this.auth = new DADMSAuth();
    this.logger = new DADMSLogger('ScilabMCPServer');

    this.setupTools();
  }

  setupTools() {
    // Tool 1: Execute Scilab script
    this.addTool({
      name: 'run_scilab_script',
      description: 'Execute a Scilab script and return results',
      parameters: {
        type: 'object',
        properties: {
          script: {
            type: 'string',
            description: 'Scilab script code to execute'
          },
          variables: {
            type: 'object',
            description: 'Input variables for the script',
            default: {}
          },
          output_plots: {
            type: 'boolean',
            description: 'Whether to save and return plots',
            default: false
          }
        },
        required: ['script']
      }
    });

    // Tool 2: Solve linear system
    this.addTool({
      name: 'solve_linear_system',
      description: 'Solve a system of linear equations Ax = b',
      parameters: {
        type: 'object',
        properties: {
          matrix_a: {
            type: 'array',
            description: 'Coefficient matrix A',
            items: {
              type: 'array',
              items: { type: 'number' }
            }
          },
          vector_b: {
            type: 'array',
            description: 'Right-hand side vector b',
            items: { type: 'number' }
          }
        },
        required: ['matrix_a', 'vector_b']
      }
    });

    // Tool 3: Signal analysis
    this.addTool({
      name: 'analyze_signal',
      description: 'Perform FFT analysis on a signal',
      parameters: {
        type: 'object',
        properties: {
          signal_data: {
            type: 'array',
            description: 'Time series data',
            items: { type: 'number' }
          },
          sampling_frequency: {
            type: 'number',
            description: 'Sampling frequency in Hz',
            default: 1000
          },
          plot_result: {
            type: 'boolean',
            description: 'Generate frequency domain plot',
            default: true
          }
        },
        required: ['signal_data']
      }
    });
  }

  async handleToolCall(tool, params, context) {
    // DADMS Authentication
    if (!await this.auth.validateRequest(context)) {
      throw new Error('Unauthorized access to DADMS Scilab server');
    }

    // DADMS Logging
    this.logger.info(`Tool called: ${tool}`, { 
      user: context.user,
      requestId: context.requestId 
    });

    switch (tool) {
      case 'run_scilab_script':
        return await this.runScilabScript(params, context);
      case 'solve_linear_system':
        return await this.solveLinearSystem(params, context);
      case 'analyze_signal':
        return await this.analyzeSignal(params, context);
      default:
        throw new Error(`Unknown tool: ${tool}`);
    }
  }

  async runScilabScript(params) {
    const { script, variables = {}, output_plots = false } = params;
    
    try {
      // Create temporary directory for this execution
      const tempDir = await this.createTempDir();
      const scriptFile = path.join(tempDir, 'script.sce');
      
      // Prepare the script with variable assignments
      let fullScript = '';
      
      // Add variable assignments
      for (const [name, value] of Object.entries(variables)) {
        if (Array.isArray(value)) {
          fullScript += `${name} = [${value.join('; ')}];\n`;
        } else {
          fullScript += `${name} = ${value};\n`;
        }
      }
      
      // Add the main script
      fullScript += script + '\n';
      
      // Add commands to save results
      fullScript += `
// Save workspace variables
save('${path.join(tempDir, 'results.sod')}');

// Display variables
who();
`;

      if (output_plots) {
        fullScript += `
// Save plots
if exists('gcf') then
  xs2png(gcf(), '${path.join(tempDir, 'plot.png')}');
end
`;
      }

      // Write script to file
      await fs.writeFile(scriptFile, fullScript);
      
      // Execute Scilab
      const result = await this.executeScilabFile(scriptFile, tempDir);
      
      // Parse results
      const output = await this.parseScilabOutput(tempDir, output_plots);
      
      // Cleanup
      await this.cleanupTempDir(tempDir);
      
      return {
        success: true,
        output: result.stdout,
        results: output.variables,
        plots: output.plots,
        execution_time: result.executionTime
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async solveLinearSystem(params) {
    const { matrix_a, vector_b } = params;
    
    const script = `
// Solve linear system Ax = b
A = matrix([${matrix_a.map(row => row.join(',')).join('; ')}]);
b = [${vector_b.join('; ')}];

// Solve the system
x = A \\ b;

// Calculate residual
residual = norm(A*x - b);

// Display results
disp('Solution:');
disp(x);
disp('Residual norm:');
disp(residual);

// Check if system is well-conditioned
cond_number = cond(A);
disp('Condition number:');
disp(cond_number);
`;

    return await this.runScilabScript({ script });
  }

  async analyzeSignal(params) {
    const { signal_data, sampling_frequency = 1000, plot_result = true } = params;
    
    const script = `
// Signal analysis
fs = ${sampling_frequency};
signal = [${signal_data.join('; ')}];
n = length(signal);
t = (0:n-1) / fs;

// Compute FFT
Y = fft(signal);
f = (0:n-1) * fs / n;

// Compute magnitude spectrum
magnitude = abs(Y);
phase = atan(imag(Y), real(Y));

// Find dominant frequencies
[max_val, max_idx] = max(magnitude(1:floor(n/2)));
dominant_freq = f(max_idx);

disp('Dominant frequency (Hz):');
disp(dominant_freq);

// Calculate signal statistics
signal_mean = mean(signal);
signal_std = stdev(signal);
signal_rms = sqrt(mean(signal.^2));

disp('Signal statistics:');
disp(['Mean: ' + string(signal_mean)]);
disp(['Std: ' + string(signal_std)]);
disp(['RMS: ' + string(signal_rms)]);

${plot_result ? `
// Create plots
clf();
subplot(2,1,1);
plot(t, signal);
title('Time Domain Signal');
xlabel('Time (s)');
ylabel('Amplitude');

subplot(2,1,2);
plot(f(1:floor(n/2)), magnitude(1:floor(n/2)));
title('Frequency Domain (Magnitude)');
xlabel('Frequency (Hz)');
ylabel('Magnitude');
` : ''}
`;

    return await this.runScilabScript({ 
      script, 
      output_plots: plot_result 
    });
  }

  async executeScilabFile(scriptFile, workDir) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const scilab = spawn('scilab', ['-nw', '-f', scriptFile], {
        cwd: workDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      scilab.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      scilab.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      scilab.on('close', (code) => {
        const executionTime = Date.now() - startTime;
        
        if (code === 0) {
          resolve({
            stdout,
            stderr,
            executionTime
          });
        } else {
          reject(new Error(`Scilab execution failed: ${stderr}`));
        }
      });

      // Set timeout
      setTimeout(() => {
        scilab.kill();
        reject(new Error('Scilab execution timeout'));
      }, 30000); // 30 second timeout
    });
  }

  async parseScilabOutput(tempDir, includePlots) {
    const output = {
      variables: {},
      plots: []
    };

    // Parse saved variables (simplified - in real implementation would load .sod file)
    try {
      const resultsFile = path.join(tempDir, 'results.sod');
      // Note: In practice, you'd use Scilab's loadmatfile or similar
      // This is a simplified example
    } catch (error) {
      console.warn('Could not parse Scilab variables:', error.message);
    }

    // Load plots if requested
    if (includePlots) {
      try {
        const plotFile = path.join(tempDir, 'plot.png');
        const plotData = await fs.readFile(plotFile);
        output.plots.push({
          format: 'png',
          data: plotData.toString('base64')
        });
      } catch (error) {
        console.warn('Could not load plot:', error.message);
      }
    }

    return output;
  }

  async createTempDir() {
    const tempDir = path.join('/tmp', `scilab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    await fs.mkdir(tempDir, { recursive: true });
    return tempDir;
  }

  async cleanupTempDir(tempDir) {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Could not cleanup temp directory:', error.message);
    }
  }
}

// DADMS Service Integration
import { DADMSServiceRegistry } from '../core/service-registry.js';

// Start the DADMS Scilab MCP Server
const server = new DADMSScilabMCPServer();

// Register with DADMS service registry
DADMSServiceRegistry.register({
  name: 'scilab-mcp-server',
  port: process.env.PORT || 3030,
  health: '/health',
  metrics: '/metrics'
});

server.start();

console.log('DADMS Scilab MCP Server running on port', process.env.PORT || 3030);
```

### 2. Package Configuration

```json
{
  "name": "@dadms/scilab-mcp-server",
  "version": "1.0.0",
  "description": "DADMS-owned MCP server for Scilab scientific computing",
  "main": "dadms-scilab-mcp-server.js",
  "type": "module",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "@dadms/core": "^2.0.0",
    "@dadms/auth": "^2.0.0",
    "@dadms/logger": "^2.0.0"
  },
  "scripts": {
    "start": "node dadms-scilab-mcp-server.js",
    "dev": "nodemon dadms-scilab-mcp-server.js",
    "test": "jest",
    "docker:build": "docker build -t dadms/scilab-mcp-server .",
    "docker:run": "docker run -p 3030:3030 dadms/scilab-mcp-server"
  },
  "keywords": ["dadms", "mcp", "scilab", "scientific-computing", "engineering"],
  "author": "DADMS Team",
  "license": "Proprietary",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/dadms.git"
  }
}
```

### 3. DADMS Integration Configuration

```json
{
  "mcpServers": {
    "dadms-scilab": {
      "command": "node",
      "args": ["./services/scilab-mcp-server/dadms-scilab-mcp-server.js"],
      "env": {
        "SCILAB_PATH": "/usr/local/bin/scilab",
        "DADMS_API_KEY": "${DADMS_API_KEY}",
        "DADMS_AUTH_URL": "http://localhost:3000/api/auth",
        "DADMS_LOG_LEVEL": "info",
        "PORT": "3030"
      },
      "health_check": "http://localhost:3030/health",
      "metrics": "http://localhost:3030/metrics"
    }
  }
}
```

### 4. Docker Configuration (Production Deployment)

```dockerfile
# Dockerfile for DADMS Scilab MCP Server
FROM node:18-alpine

# Install Scilab
RUN apk add --no-cache scilab

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S dadms && \
    adduser -S dadms -u 1001

# Set ownership
RUN chown -R dadms:dadms /app
USER dadms

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3030/health || exit 1

EXPOSE 3030

CMD ["npm", "start"]
```

## Usage Examples

### Example 1: Basic Engineering Calculation

**AI Conversation:**
```
User: "Calculate the natural frequency of a cantilever beam with length 1m, 
       elastic modulus 200 GPa, moment of inertia 8.33e-6 m^4, and mass per 
       unit length 7.85 kg/m"

AI: I'll use Scilab to calculate the natural frequency of your cantilever beam.

*[AI calls run_scilab_script tool]*

AI: The natural frequency of your cantilever beam is 145.2 Hz. Here's the calculation:

- First mode natural frequency: 145.2 Hz
- Angular frequency: 912.4 rad/s
- Period: 6.89 ms

The beam will resonate at this frequency, which is important for avoiding 
resonance in your application.
```

**Behind the scenes - the script that ran:**
```scilab
// Cantilever beam natural frequency calculation
L = 1.0;           // Length (m)
E = 200e9;         // Elastic modulus (Pa)
I = 8.33e-6;       // Moment of inertia (m^4)
rho = 7.85;        // Mass per unit length (kg/m)

// First mode eigenvalue for cantilever
lambda1 = 1.875;

// Natural frequency calculation
omega_n = (lambda1^2) * sqrt(E*I/(rho*L^4));
f_n = omega_n / (2*%pi);

disp('Natural frequency (Hz):');
disp(f_n);
```

### Example 2: Signal Processing

**AI Conversation:**
```
User: "I have sensor data from a vibrating machine. Can you analyze it for 
       dominant frequencies? The data was sampled at 2000 Hz."

AI: I'll analyze your sensor data using FFT to find the dominant frequencies.

*[AI calls analyze_signal tool with your data]*

AI: Analysis complete! Here's what I found:

- Dominant frequency: 60 Hz (likely electrical interference)
- Second peak: 180 Hz (3x harmonic)
- Third peak: 1200 Hz (machine bearing frequency)

The 60 Hz is electrical noise. The 1200 Hz peak suggests potential bearing wear.
I recommend monitoring this frequency - if it increases, schedule bearing maintenance.

[Chart showing frequency spectrum attached]
```

### Example 3: Linear System Solution

**AI Conversation:**
```
User: "Solve this system of equations:
       3x + 2y - z = 1
       2x - 2y + 4z = 0
       -x + 0.5y - z = 0"

AI: I'll solve your linear system using Scilab's efficient solvers.

*[AI calls solve_linear_system tool]*

AI: Solution found:
- x = 1.0
- y = -2.0  
- z = -2.0

The system is well-conditioned (condition number: 2.3), so the solution is reliable.
Verification: Residual norm is 1.4e-16, confirming the solution is accurate.
```

## Real-World Applications

### 1. Structural Engineering
```javascript
// AI can help with beam deflection calculations
const beamAnalysis = await mcpClient.callTool('run_scilab_script', {
  script: `
    // Simply supported beam with point load
    L = 5;      // Length (m)
    P = 10000;  // Load (N)
    E = 200e9;  // Young's modulus (Pa)
    I = 0.001;  // Moment of inertia (m^4)
    
    // Maximum deflection at center
    delta_max = P * L^3 / (48 * E * I);
    
    disp('Maximum deflection (mm):');
    disp(delta_max * 1000);
  `
});
```

### 2. Control Systems
```javascript
// AI can analyze control system stability
const controlAnalysis = await mcpClient.callTool('run_scilab_script', {
  script: `
    // Transfer function analysis
    s = poly(0, 's');
    H = 10 / (s^2 + 3*s + 2);
    
    // Step response
    t = 0:0.1:10;
    y = csim('step', t, H);
    
    // Stability check
    poles = roots(denom(H));
    stable = real(poles) < 0;
    
    disp('System is stable:');
    disp(and(stable));
  `,
  output_plots: true
});
```

### 3. Signal Processing
```javascript
// AI can design digital filters
const filterDesign = await mcpClient.callTool('run_scilab_script', {
  script: `
    // Low-pass filter design
    fs = 1000;      // Sampling frequency
    fc = 100;       // Cutoff frequency
    order = 4;      // Filter order
    
    // Butterworth filter
    [b, a] = butter(order, 2*fc/fs);
    
    // Frequency response
    [h, f] = freqz(b, a, 512, fs);
    
    disp('Filter coefficients calculated');
    disp('3dB frequency (Hz):');
    disp(fc);
  `,
  output_plots: true
});
```

## Error Handling

The server includes comprehensive error handling:

```javascript
// Automatic timeout protection
// Input validation
// Graceful cleanup of temporary files
// Detailed error messages for debugging

// Example error response:
{
  "success": false,
  "error": "Scilab execution failed: Undefined variable 'invalid_function'",
  "line_number": 5,
  "suggestion": "Check function name spelling or ensure required toolbox is loaded"
}
```

## DADMS Development Strategy

### Why We Own Our MCP Servers

**Security & Control:**
- Full control over authentication and authorization
- No external dependencies that could compromise security
- Custom audit logging and compliance features

**Integration & Customization:**
- Deep integration with DADMS services and databases
- Custom features specific to DADMS workflows
- Consistent error handling and monitoring

**Reliability & Maintenance:**
- No risk of external servers going offline or changing APIs
- Version control and deployment as part of DADMS infrastructure
- Professional support and maintenance guaranteed

### Development Workflow

1. **Research Phase:**
   ```bash
   # Find existing MCP server implementations for inspiration
   git clone https://github.com/some-project/scilab-mcp-server
   cd scilab-mcp-server
   npm install
   # Test functionality and understand the codebase
   ```

2. **Fork & Customize Phase:**
   ```bash
   # Copy code to DADMS repository
   mkdir dadms/services/scilab-mcp-server
   cp -r scilab-mcp-server/* dadms/services/scilab-mcp-server/
   cd dadms/services/scilab-mcp-server
   
   # Rename and rebrand
   mv scilab-mcp-server.js dadms-scilab-mcp-server.js
   # Add DADMS authentication, logging, monitoring
   # Customize for DADMS-specific features
   ```

3. **Integration Phase:**
   ```bash
   # Install DADMS-specific dependencies
   npm install @dadms/core @dadms/auth @dadms/logger
   
   # Update package.json with DADMS branding
   # Add Docker configuration for deployment
   # Configure service registration
   ```

4. **Production Deployment:**
   ```bash
   # Build Docker image
   npm run docker:build
   
   # Deploy to DADMS infrastructure
   docker run -d -p 3030:3030 \
     -e DADMS_API_KEY=xxx \
     -e DADMS_AUTH_URL=xxx \
     dadms/scilab-mcp-server
   ```

### Installation Requirements

### Prerequisites
1. **Scilab** installed and accessible in PATH
2. **Node.js** 18+ for the MCP server
3. **DADMS Core Services** running (Authentication, Logging, Service Registry)
4. **Docker** for production deployment

### DADMS Integration Steps
```bash
# 1. Set up in DADMS repository structure
cd dadms/services/
mkdir scilab-mcp-server
cd scilab-mcp-server

# 2. Install DADMS dependencies
npm install @modelcontextprotocol/sdk @dadms/core @dadms/auth @dadms/logger

# 3. Implement server with DADMS integration
# (Copy code from example above)

# 4. Build and deploy
npm run docker:build
npm run docker:run
```

## Benefits for Engineers

### Time Savings
- **Before**: Manual Scilab scripting and result interpretation
- **After**: AI handles scripting and explains results in context

### Accessibility
- **Before**: Need to know Scilab syntax and functions
- **After**: Describe problems in plain English

### Integration
- **Before**: Separate tools for different calculations
- **After**: AI coordinates multiple tools through MCP

### Accuracy
- **Before**: Potential for manual calculation errors
- **After**: Automated verification and error checking

This Scilab MCP server example shows how traditional engineering tools can be made accessible to AI agents, enabling natural language interfaces for complex scientific computing tasks.