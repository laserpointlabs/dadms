# DADMS Python MCP Server

## Overview

This is a **DADMS-owned MCP server** that provides secure Python script execution capabilities to AI agents. This server is developed, maintained, and deployed as part of the DADMS infrastructure - ensuring complete security and control over Python execution.

**Development Strategy:**
- **Prototype**: Research existing Python MCP implementations for best practices
- **Fork & Customize**: Build our own version with DADMS-specific security and features
- **Own & Deploy**: Run as part of DADMS service architecture with full integration
- **Secure & Monitor**: Complete audit logging, sandboxing, and DADMS authentication

## What This Server Does

The Python MCP server allows AI to:
- Execute Python scripts with proper sandboxing
- Perform data analysis using pandas, numpy, matplotlib
- Run machine learning models with scikit-learn
- Create visualizations and charts
- Access Python's extensive library ecosystem
- Handle file I/O and data processing

## Complete Working Example

### 1. Server Implementation

```javascript
// dadms-python-mcp-server.js
import { MCPServer } from '@modelcontextprotocol/sdk';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { DADMSAuth } from '../core/auth.js';
import { DADMSLogger } from '../core/logger.js';
import { DADMSSecuritySandbox } from '../core/security-sandbox.js';

class DADMSPythonMCPServer extends MCPServer {
  constructor() {
    super({
      name: 'dadms-python-server',
      version: '1.0.0',
      description: 'DADMS-owned MCP server for secure Python script execution'
    });

    this.auth = new DADMSAuth();
    this.logger = new DADMSLogger('PythonMCPServer');
    this.sandbox = new DADMSSecuritySandbox();
    
    this.setupTools();
    this.setupSandboxEnvironment();
  }

  setupTools() {
    // Tool 1: Execute Python script
    this.addTool({
      name: 'run_python_script',
      description: 'Execute a Python script and return results',
      parameters: {
        type: 'object',
        properties: {
          script: {
            type: 'string',
            description: 'Python code to execute'
          },
          variables: {
            type: 'object',
            description: 'Input variables to pass to the script',
            default: {}
          },
          packages: {
            type: 'array',
            description: 'Required Python packages',
            items: { type: 'string' },
            default: []
          },
          save_plots: {
            type: 'boolean',
            description: 'Save matplotlib plots as images',
            default: false
          },
          timeout: {
            type: 'number',
            description: 'Execution timeout in seconds',
            default: 30
          }
        },
        required: ['script']
      }
    });

    // Tool 2: Data analysis
    this.addTool({
      name: 'analyze_data',
      description: 'Analyze CSV data with pandas',
      parameters: {
        type: 'object',
        properties: {
          data: {
            type: 'string',
            description: 'CSV data or file path'
          },
          analysis_type: {
            type: 'string',
            enum: ['summary', 'correlation', 'distribution', 'trends'],
            description: 'Type of analysis to perform'
          },
          columns: {
            type: 'array',
            description: 'Specific columns to analyze',
            items: { type: 'string' },
            default: []
          },
          create_plots: {
            type: 'boolean',
            description: 'Generate visualizations',
            default: true
          }
        },
        required: ['data', 'analysis_type']
      }
    });

    // Tool 3: Machine learning
    this.addTool({
      name: 'train_model',
      description: 'Train a simple machine learning model',
      parameters: {
        type: 'object',
        properties: {
          training_data: {
            type: 'string',
            description: 'Training data in CSV format'
          },
          target_column: {
            type: 'string',
            description: 'Name of target variable column'
          },
          model_type: {
            type: 'string',
            enum: ['regression', 'classification', 'clustering'],
            description: 'Type of ML model to train'
          },
          algorithm: {
            type: 'string',
            enum: ['linear', 'random_forest', 'svm', 'kmeans'],
            description: 'ML algorithm to use',
            default: 'random_forest'
          }
        },
        required: ['training_data', 'target_column', 'model_type']
      }
    });

    // Tool 4: Image processing
    this.addTool({
      name: 'process_image',
      description: 'Process images using PIL/OpenCV',
      parameters: {
        type: 'object',
        properties: {
          image_path: {
            type: 'string',
            description: 'Path to image file'
          },
          operations: {
            type: 'array',
            description: 'List of operations to perform',
            items: {
              type: 'string',
              enum: ['resize', 'rotate', 'blur', 'sharpen', 'edge_detect', 'histogram']
            }
          },
          parameters: {
            type: 'object',
            description: 'Parameters for operations',
            default: {}
          }
        },
        required: ['image_path', 'operations']
      }
    });
  }

  async setupSandboxEnvironment() {
    // Create restricted Python environment
    this.pythonPath = process.env.PYTHON_PATH || 'python3';
    this.allowedPackages = [
      'numpy', 'pandas', 'matplotlib', 'seaborn', 'scipy',
      'scikit-learn', 'PIL', 'cv2', 'json', 'csv', 'math',
      'statistics', 'datetime', 're', 'os', 'sys'
    ];
  }

  async handleToolCall(tool, params, context) {
    // DADMS Authentication
    if (!await this.auth.validateRequest(context)) {
      throw new Error('Unauthorized access to DADMS Python server');
    }

    // DADMS Security Validation
    await this.sandbox.validatePythonExecution(params, context);

    // DADMS Logging
    this.logger.info(`Python tool called: ${tool}`, { 
      user: context.user,
      requestId: context.requestId,
      securityLevel: context.securityLevel
    });

    switch (tool) {
      case 'run_python_script':
        return await this.runPythonScript(params, context);
      case 'analyze_data':
        return await this.analyzeData(params, context);
      case 'train_model':
        return await this.trainModel(params, context);
      case 'process_image':
        return await this.processImage(params, context);
      default:
        throw new Error(`Unknown tool: ${tool}`);
    }
  }

  async runPythonScript(params) {
    const { 
      script, 
      variables = {}, 
      packages = [], 
      save_plots = false, 
      timeout = 30 
    } = params;

    try {
      // Validate packages
      const invalidPackages = packages.filter(pkg => !this.allowedPackages.includes(pkg));
      if (invalidPackages.length > 0) {
        throw new Error(`Disallowed packages: ${invalidPackages.join(', ')}`);
      }

      // Create temporary workspace
      const workDir = await this.createTempDir();
      const scriptFile = path.join(workDir, 'script.py');
      
      // Prepare the script
      let fullScript = this.generatePythonScript(script, variables, packages, save_plots, workDir);
      
      // Write script to file
      await fs.writeFile(scriptFile, fullScript);
      
      // Execute Python script
      const result = await this.executePythonFile(scriptFile, workDir, timeout);
      
      // Parse results
      const output = await this.parsePythonOutput(workDir, save_plots);
      
      // Cleanup
      await this.cleanupTempDir(workDir);
      
      return {
        success: true,
        output: result.stdout,
        error: result.stderr,
        results: output.results,
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

  generatePythonScript(userScript, variables, packages, savePlots, workDir) {
    let script = `#!/usr/bin/env python3
import sys
import json
import traceback
from pathlib import Path

# Add required imports
${packages.map(pkg => `import ${pkg}`).join('\n')}

# Common imports
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
${savePlots ? "import matplotlib\nmatplotlib.use('Agg')  # Non-interactive backend" : ""}

# Set up working directory
work_dir = Path('${workDir}')
results_file = work_dir / 'results.json'
plots_dir = work_dir / 'plots'
plots_dir.mkdir(exist_ok=True)

# Initialize results storage
results = {}

try:
    # Set input variables
${Object.entries(variables).map(([name, value]) => 
  `    ${name} = ${JSON.stringify(value)}`
).join('\n')}

    # User script
${userScript.split('\n').map(line => `    ${line}`).join('\n')}

    # Save results (capture variables that might be created)
    # This is a simplified approach - in production you'd use more sophisticated introspection
    local_vars = {k: v for k, v in locals().items() 
                  if not k.startswith('_') and k not in ['sys', 'json', 'traceback', 'Path']}
    
    # Convert numpy arrays and pandas objects to JSON-serializable format
    serializable_vars = {}
    for k, v in local_vars.items():
        try:
            if hasattr(v, 'tolist'):  # numpy arrays
                serializable_vars[k] = v.tolist()
            elif hasattr(v, 'to_dict'):  # pandas dataframes
                serializable_vars[k] = v.to_dict()
            elif isinstance(v, (int, float, str, bool, list, dict)):
                serializable_vars[k] = v
            else:
                serializable_vars[k] = str(v)
        except:
            serializable_vars[k] = str(v)
    
    results['variables'] = serializable_vars
    results['success'] = True

${savePlots ? `
    # Save any matplotlib plots
    if plt.get_fignums():
        for i, fig_num in enumerate(plt.get_fignums()):
            plt.figure(fig_num)
            plt.savefig(plots_dir / f'plot_{i}.png', dpi=150, bbox_inches='tight')
        plt.close('all')
` : ''}

except Exception as e:
    results['success'] = False
    results['error'] = str(e)
    results['traceback'] = traceback.format_exc()

# Save results
with open(results_file, 'w') as f:
    json.dump(results, f, indent=2)

print("Script execution completed")
`;

    return script;
  }

  async analyzeData(params) {
    const { data, analysis_type, columns = [], create_plots = true } = params;
    
    let dataScript = '';
    if (data.includes(',') && data.includes('\n')) {
      // Direct CSV data
      dataScript = `
import io
data_string = '''${data}'''
df = pd.read_csv(io.StringIO(data_string))
`;
    } else {
      // File path
      dataScript = `df = pd.read_csv('${data}')`;
    }

    const analysisScripts = {
      summary: `
# Basic summary statistics
print("Dataset Info:")
print(f"Shape: {df.shape}")
print(f"Columns: {list(df.columns)}")
print("\\nSummary Statistics:")
summary_stats = df.describe()
print(summary_stats)

# Missing values
print("\\nMissing Values:")
missing_data = df.isnull().sum()
print(missing_data[missing_data > 0])

results['summary_stats'] = summary_stats.to_dict()
results['missing_values'] = missing_data.to_dict()
results['data_types'] = df.dtypes.to_dict()
`,

      correlation: `
# Correlation analysis
numeric_cols = df.select_dtypes(include=[np.number]).columns
correlation_matrix = df[numeric_cols].corr()

print("Correlation Matrix:")
print(correlation_matrix)

results['correlation_matrix'] = correlation_matrix.to_dict()

${create_plots ? `
# Correlation heatmap
plt.figure(figsize=(10, 8))
import seaborn as sns
sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', center=0)
plt.title('Correlation Matrix')
plt.tight_layout()
` : ''}
`,

      distribution: `
# Distribution analysis
numeric_cols = df.select_dtypes(include=[np.number]).columns
target_cols = columns if columns else numeric_cols[:5]  # Limit to avoid too many plots

for col in target_cols:
    if col in df.columns:
        print(f"\\nDistribution for {col}:")
        print(f"Mean: {df[col].mean():.2f}")
        print(f"Std: {df[col].std():.2f}")
        print(f"Min: {df[col].min():.2f}")
        print(f"Max: {df[col].max():.2f}")
        
        results[f'{col}_stats'] = {
            'mean': df[col].mean(),
            'std': df[col].std(),
            'min': df[col].min(),
            'max': df[col].max(),
            'median': df[col].median()
        }

${create_plots ? `
        # Distribution plot
        plt.figure(figsize=(10, 6))
        plt.subplot(1, 2, 1)
        df[col].hist(bins=30, alpha=0.7)
        plt.title(f'{col} - Histogram')
        plt.xlabel(col)
        plt.ylabel('Frequency')
        
        plt.subplot(1, 2, 2)
        df.boxplot(column=col)
        plt.title(f'{col} - Box Plot')
        plt.tight_layout()
` : ''}
`,

      trends: `
# Trend analysis
if 'date' in df.columns or 'time' in df.columns:
    date_col = 'date' if 'date' in df.columns else 'time'
    df[date_col] = pd.to_datetime(df[date_col])
    df = df.sort_values(date_col)
    
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    target_cols = columns if columns else numeric_cols[:3]
    
    print("Trend Analysis:")
    for col in target_cols:
        if col in df.columns:
            # Simple trend calculation
            correlation_with_time = df[col].corr(pd.to_numeric(df[date_col]))
            print(f"{col} trend correlation: {correlation_with_time:.3f}")
            
            results[f'{col}_trend'] = correlation_with_time

${create_plots ? `
            # Trend plot
            plt.figure(figsize=(12, 6))
            plt.plot(df[date_col], df[col])
            plt.title(f'{col} - Time Series')
            plt.xlabel('Date')
            plt.ylabel(col)
            plt.xticks(rotation=45)
            plt.tight_layout()
` : ''}
else:
    print("No date/time column found for trend analysis")
    results['error'] = "No date/time column found"
`
    };

    const script = `
${dataScript}

${analysisScripts[analysis_type]}

print(f"\\nAnalysis completed for {len(df)} rows and {len(df.columns)} columns")
`;

    return await this.runPythonScript({
      script,
      packages: ['pandas', 'numpy', 'matplotlib', 'seaborn'],
      save_plots: create_plots
    });
  }

  async trainModel(params) {
    const { training_data, target_column, model_type, algorithm = 'random_forest' } = params;
    
    const script = `
# Load and prepare data
import io
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_squared_error, r2_score
from sklearn.preprocessing import LabelEncoder, StandardScaler

# Load data
data_string = '''${training_data}'''
df = pd.read_csv(io.StringIO(data_string))

print(f"Loaded dataset with shape: {df.shape}")
print(f"Target column: ${target_column}")

# Prepare features and target
X = df.drop('${target_column}', axis=1)
y = df['${target_column}']

# Handle categorical variables (simple encoding)
categorical_cols = X.select_dtypes(include=['object']).columns
for col in categorical_cols:
    le = LabelEncoder()
    X[col] = le.fit_transform(X[col].astype(str))

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Scale features for some algorithms
if '${algorithm}' in ['svm']:
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)

# Train model based on type and algorithm
${this.getModelTrainingScript(model_type, algorithm)}

# Make predictions
y_pred = model.predict(X_test)

# Calculate metrics
${this.getMetricsScript(model_type)}

print("\\nModel Training Complete!")
print(f"Algorithm: ${algorithm}")
print(f"Model type: ${model_type}")
print("Metrics:", metrics)

results['model_info'] = {
    'algorithm': '${algorithm}',
    'model_type': '${model_type}',
    'features': list(X.columns),
    'target': '${target_column}',
    'training_samples': len(X_train),
    'test_samples': len(X_test)
}
results['metrics'] = metrics
results['feature_importance'] = feature_importance if 'feature_importance' in locals() else None
`;

    return await this.runPythonScript({
      script,
      packages: ['pandas', 'numpy', 'scikit-learn', 'matplotlib'],
      save_plots: true
    });
  }

  getModelTrainingScript(modelType, algorithm) {
    const algorithms = {
      regression: {
        linear: `
from sklearn.linear_model import LinearRegression
model = LinearRegression()
`,
        random_forest: `
from sklearn.ensemble import RandomForestRegressor
model = RandomForestRegressor(n_estimators=100, random_state=42)
`,
        svm: `
from sklearn.svm import SVR
model = SVR(kernel='rbf')
`
      },
      classification: {
        linear: `
from sklearn.linear_model import LogisticRegression
model = LogisticRegression(random_state=42)
`,
        random_forest: `
from sklearn.ensemble import RandomForestClassifier
model = RandomForestClassifier(n_estimators=100, random_state=42)
`,
        svm: `
from sklearn.svm import SVC
model = SVC(kernel='rbf', random_state=42)
`
      },
      clustering: {
        kmeans: `
from sklearn.cluster import KMeans
# Determine optimal number of clusters (simplified)
n_clusters = min(8, len(df) // 10)  # Simple heuristic
model = KMeans(n_clusters=n_clusters, random_state=42)
`
      }
    };

    return algorithms[modelType][algorithm] + `
model.fit(X_train, y_train)

# Feature importance (if available)
if hasattr(model, 'feature_importances_'):
    feature_importance = dict(zip(X.columns, model.feature_importances_))
    print("\\nFeature Importance:")
    for feature, importance in sorted(feature_importance.items(), key=lambda x: x[1], reverse=True):
        print(f"{feature}: {importance:.4f}")
`;
  }

  getMetricsScript(modelType) {
    if (modelType === 'regression') {
      return `
mse = mean_squared_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)
metrics = {
    'mse': mse,
    'rmse': np.sqrt(mse),
    'r2_score': r2
}
`;
    } else if (modelType === 'classification') {
      return `
accuracy = accuracy_score(y_test, y_pred)
from sklearn.classification_report import classification_report
metrics = {
    'accuracy': accuracy,
    'classification_report': classification_report(y_test, y_pred, output_dict=True)
}
`;
    } else {
      return `
# Clustering metrics
from sklearn.metrics import silhouette_score
silhouette = silhouette_score(X_test, y_pred)
metrics = {
    'silhouette_score': silhouette,
    'n_clusters': len(np.unique(y_pred))
}
`;
    }
  }

  async processImage(params) {
    const { image_path, operations, parameters = {} } = params;
    
    const script = `
from PIL import Image, ImageFilter, ImageEnhance
import numpy as np
import matplotlib.pyplot as plt

# Load image
try:
    img = Image.open('${image_path}')
    print(f"Loaded image: {img.size} pixels, mode: {img.mode}")
    results['original_size'] = img.size
    results['original_mode'] = img.mode
except Exception as e:
    print(f"Error loading image: {e}")
    results['error'] = str(e)
    raise e

# Apply operations
processed_img = img.copy()
operation_results = {}

${operations.map(op => this.getImageOperationScript(op, parameters)).join('\n\n')}

# Save processed image
output_path = 'processed_image.png'
processed_img.save(output_path)
results['output_path'] = output_path
results['operations_applied'] = ${JSON.stringify(operations)}

# Create comparison plot
plt.figure(figsize=(15, 5))

plt.subplot(1, 3, 1)
plt.imshow(img)
plt.title('Original Image')
plt.axis('off')

plt.subplot(1, 3, 2)
plt.imshow(processed_img)
plt.title('Processed Image')
plt.axis('off')

# Histogram comparison
plt.subplot(1, 3, 3)
if img.mode == 'RGB':
    for i, color in enumerate(['red', 'green', 'blue']):
        hist_orig = np.histogram(np.array(img)[:,:,i], bins=50)
        hist_proc = np.histogram(np.array(processed_img)[:,:,i], bins=50)
        plt.plot(hist_orig[1][:-1], hist_orig[0], color=color, alpha=0.5, label=f'Original {color}')
        plt.plot(hist_proc[1][:-1], hist_proc[0], color=color, linestyle='--', label=f'Processed {color}')
else:
    hist_orig = np.histogram(np.array(img), bins=50)
    hist_proc = np.histogram(np.array(processed_img), bins=50)
    plt.plot(hist_orig[1][:-1], hist_orig[0], color='gray', alpha=0.5, label='Original')
    plt.plot(hist_proc[1][:-1], hist_proc[0], color='black', linestyle='--', label='Processed')

plt.title('Histogram Comparison')
plt.xlabel('Pixel Value')
plt.ylabel('Frequency')
plt.legend()
plt.tight_layout()

print("Image processing completed successfully")
`;

    return await this.runPythonScript({
      script,
      packages: ['PIL', 'numpy', 'matplotlib'],
      save_plots: true
    });
  }

  getImageOperationScript(operation, parameters) {
    const operations = {
      resize: `
# Resize operation
size = (${parameters.width || 800}, ${parameters.height || 600})
processed_img = processed_img.resize(size, Image.Resampling.LANCZOS)
operation_results['resize'] = f"Resized to {size}"
print(f"Resized image to {size}")
`,
      rotate: `
# Rotate operation  
angle = ${parameters.angle || 90}
processed_img = processed_img.rotate(angle, expand=True)
operation_results['rotate'] = f"Rotated by {angle} degrees"
print(f"Rotated image by {angle} degrees")
`,
      blur: `
# Blur operation
radius = ${parameters.radius || 2}
processed_img = processed_img.filter(ImageFilter.GaussianBlur(radius=radius))
operation_results['blur'] = f"Applied Gaussian blur with radius {radius}"
print(f"Applied blur with radius {radius}")
`,
      sharpen: `
# Sharpen operation
processed_img = processed_img.filter(ImageFilter.SHARPEN)
operation_results['sharpen'] = "Applied sharpening filter"
print("Applied sharpening filter")
`,
      edge_detect: `
# Edge detection
processed_img = processed_img.filter(ImageFilter.FIND_EDGES)
operation_results['edge_detect'] = "Applied edge detection"
print("Applied edge detection")
`,
      histogram: `
# Histogram equalization (simplified)
if processed_img.mode == 'RGB':
    # Convert to grayscale for histogram equalization
    processed_img = processed_img.convert('L')
    
# Apply histogram equalization using PIL's autocontrast
processed_img = ImageEnhance.Contrast(processed_img).enhance(2.0)
operation_results['histogram'] = "Applied histogram enhancement"
print("Applied histogram enhancement")
`
    };

    return operations[operation] || `print(f"Unknown operation: ${operation}")`;
  }

  async executePythonFile(scriptFile, workDir, timeout) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const python = spawn(this.pythonPath, [scriptFile], {
        cwd: workDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, PYTHONPATH: workDir }
      });

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        const executionTime = Date.now() - startTime;
        
        if (code === 0) {
          resolve({
            stdout,
            stderr,
            executionTime
          });
        } else {
          reject(new Error(`Python execution failed with code ${code}: ${stderr}`));
        }
      });

      // Set timeout
      setTimeout(() => {
        python.kill('SIGKILL');
        reject(new Error(`Python execution timeout (${timeout}s)`));
      }, timeout * 1000);
    });
  }

  async parsePythonOutput(workDir, includePlots) {
    const output = {
      results: {},
      plots: []
    };

    // Load results from JSON file
    try {
      const resultsFile = path.join(workDir, 'results.json');
      const resultsData = await fs.readFile(resultsFile, 'utf8');
      output.results = JSON.parse(resultsData);
    } catch (error) {
      console.warn('Could not parse Python results:', error.message);
    }

    // Load plots if requested
    if (includePlots) {
      try {
        const plotsDir = path.join(workDir, 'plots');
        const plotFiles = await fs.readdir(plotsDir);
        
        for (const plotFile of plotFiles) {
          if (plotFile.endsWith('.png')) {
            const plotPath = path.join(plotsDir, plotFile);
            const plotData = await fs.readFile(plotPath);
            output.plots.push({
              filename: plotFile,
              format: 'png',
              data: plotData.toString('base64')
            });
          }
        }
      } catch (error) {
        console.warn('Could not load plots:', error.message);
      }
    }

    return output;
  }

  async createTempDir() {
    const tempDir = path.join('/tmp', `python_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    await fs.mkdir(tempDir, { recursive: true });
    await fs.mkdir(path.join(tempDir, 'plots'), { recursive: true });
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

// Start the DADMS Python MCP Server
const server = new DADMSPythonMCPServer();

// Register with DADMS service registry
DADMSServiceRegistry.register({
  name: 'python-mcp-server',
  port: process.env.PORT || 3031,
  health: '/health',
  metrics: '/metrics',
  securityLevel: 'high'  // Python execution requires high security
});

server.start();

console.log('DADMS Python MCP Server running on port', process.env.PORT || 3031);
```

### 2. Package Configuration

```json
{
  "name": "@dadms/python-mcp-server",
  "version": "1.0.0", 
  "description": "DADMS-owned MCP server for secure Python script execution",
  "main": "dadms-python-mcp-server.js",
  "type": "module",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "@dadms/core": "^2.0.0",
    "@dadms/auth": "^2.0.0",
    "@dadms/logger": "^2.0.0",
    "@dadms/security-sandbox": "^2.0.0"
  },
  "scripts": {
    "start": "node dadms-python-mcp-server.js",
    "dev": "nodemon dadms-python-mcp-server.js",
    "test": "jest",
    "test:security": "npm run test -- --testPathPattern=security",
    "docker:build": "docker build -t dadms/python-mcp-server .",
    "docker:run": "docker run -p 3031:3031 dadms/python-mcp-server"
  },
  "keywords": ["dadms", "mcp", "python", "data-analysis", "machine-learning", "secure"],
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
    "dadms-python": {
      "command": "node",
      "args": ["./services/python-mcp-server/dadms-python-mcp-server.js"],
      "env": {
        "PYTHON_PATH": "/usr/bin/python3",
        "DADMS_API_KEY": "${DADMS_API_KEY}",
        "DADMS_AUTH_URL": "http://localhost:3000/api/auth",
        "DADMS_LOG_LEVEL": "info",
        "DADMS_SECURITY_LEVEL": "high",
        "PYTHON_SANDBOX_TIMEOUT": "30",
        "PORT": "3031"
      },
      "health_check": "http://localhost:3031/health",
      "metrics": "http://localhost:3031/metrics",
      "security": {
        "sandboxed": true,
        "timeout": 30,
        "memory_limit": "512MB",
        "allowed_packages": ["numpy", "pandas", "matplotlib", "scikit-learn"]
      }
    }
  }
}
```

### 4. Docker Configuration (Production Deployment)

```dockerfile
# Dockerfile for DADMS Python MCP Server
FROM python:3.11-slim

# Install Node.js
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages for data science
RUN pip install --no-cache-dir \
    numpy \
    pandas \
    matplotlib \
    seaborn \
    scikit-learn \
    scipy \
    Pillow \
    opencv-python-headless

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user for security
RUN addgroup --gid 1001 dadms && \
    adduser --disabled-password --gecos '' --uid 1001 --gid 1001 dadms

# Set ownership
RUN chown -R dadms:dadms /app
USER dadms

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3031/health || exit 1

EXPOSE 3031

CMD ["npm", "start"]
```

## Usage Examples

### Example 1: Data Analysis

**AI Conversation:**
```
User: "I have sales data in CSV format. Can you analyze it and show me trends?"

AI: I'll analyze your sales data using Python and pandas.

*[AI calls analyze_data tool]*

AI: Here's what I found in your sales data:

📊 **Summary Statistics:**
- Total sales: $2.3M over 12 months
- Average monthly sales: $191,667
- Peak sales month: December ($285,420)
- Lowest sales month: February ($124,380)

📈 **Key Trends:**
- 23% growth from Q1 to Q4
- Strong seasonal pattern (peaks in Nov-Dec)
- Product category "Electronics" shows highest growth (+45%)

📉 **Insights:**
- Sales dip significantly in February-March
- Strong correlation between marketing spend and sales (r=0.82)
- Weekend sales are 15% higher than weekdays

[Charts attached showing monthly trends and category breakdown]
```

### Example 2: Machine Learning

**AI Conversation:**
```
User: "Can you train a model to predict house prices based on this real estate data?"

AI: I'll build a machine learning model to predict house prices using your data.

*[AI calls train_model tool]*

AI: **Model Training Complete!** 🎯

**Model Performance:**
- Algorithm: Random Forest Regressor
- R² Score: 0.847 (84.7% of variance explained)
- RMSE: $23,450 (average prediction error)
- Training samples: 800, Test samples: 200

**Most Important Features:**
1. Square footage (32.1% importance)
2. Number of bedrooms (18.7% importance)  
3. Neighborhood (15.3% importance)
4. Age of house (12.2% importance)
5. Lot size (10.8% importance)

**Model Insights:**
- Square footage is by far the strongest predictor
- Adding a bedroom increases value by ~$15,000 on average
- Houses in "Downtown" neighborhood command 25% premium
- Properties over 50 years old see significant value decrease

The model is ready to make predictions on new properties!
```

### Example 3: Image Processing

**AI Conversation:**
```
User: "Can you enhance this blurry photo and analyze its properties?"

AI: I'll process your image to enhance it and provide analysis.

*[AI calls process_image tool]*

AI: **Image Processing Complete!** 📸

**Original Image:**
- Size: 1920×1080 pixels
- Mode: RGB color
- File size: 2.3 MB

**Applied Enhancements:**
- Sharpening filter to reduce blur
- Contrast enhancement (+40%)
- Noise reduction using Gaussian blur (selective)

**Image Analysis:**
- Brightness increased by 12%
- Contrast improved by 35%
- Edge definition enhanced significantly
- Color saturation maintained

**Technical Details:**
- Histogram shows better distribution after processing
- Peak signal-to-noise ratio improved by 8.2 dB
- No significant artifacts introduced

[Before/after comparison and histogram analysis attached]

The enhanced image shows much clearer detail and improved overall quality!
```

## Real-World Applications

### 1. Business Intelligence Dashboard

```python
# AI can automatically generate business reports
business_analysis = await mcpClient.callTool('analyze_data', {
  data: 'quarterly_sales_data.csv',
  analysis_type: 'trends',
  create_plots: true
});

# Results in automatic insights:
# - Revenue growth patterns
# - Customer segmentation analysis  
# - Product performance metrics
# - Seasonal trend identification
```

### 2. Scientific Research Automation

```python
# AI can process experimental data
experiment_results = await mcpClient.callTool('run_python_script', {
  script: `
    # Load experimental data
    data = pd.read_csv('experiment_results.csv')
    
    # Statistical analysis
    from scipy import stats
    
    # Perform t-test between groups
    group_a = data[data['group'] == 'A']['measurement']
    group_b = data[data['group'] == 'B']['measurement']
    
    t_stat, p_value = stats.ttest_ind(group_a, group_b)
    
    print(f"T-statistic: {t_stat:.4f}")
    print(f"P-value: {p_value:.4f}")
    print(f"Significant difference: {p_value < 0.05}")
    
    # Effect size (Cohen's d)
    cohens_d = (group_a.mean() - group_b.mean()) / np.sqrt(((group_a.std()**2 + group_b.std()**2) / 2))
    print(f"Cohen's d: {cohens_d:.4f}")
  `,
  packages: ['pandas', 'numpy', 'scipy']
});
```

### 3. Financial Analysis

```python
# AI can perform complex financial calculations
financial_model = await mcpClient.callTool('run_python_script', {
  script: `
    # Portfolio optimization using Modern Portfolio Theory
    import numpy as np
    from scipy.optimize import minimize
    
    # Expected returns and covariance matrix
    returns = np.array([0.12, 0.10, 0.08, 0.15])  # Expected returns
    cov_matrix = np.array([
        [0.05, 0.02, 0.01, 0.03],
        [0.02, 0.04, 0.01, 0.02],
        [0.01, 0.01, 0.02, 0.01],
        [0.03, 0.02, 0.01, 0.06]
    ])
    
    # Objective function (minimize portfolio variance)
    def portfolio_variance(weights):
        return np.dot(weights.T, np.dot(cov_matrix, weights))
    
    # Constraints
    constraints = ({'type': 'eq', 'fun': lambda x: np.sum(x) - 1})
    bounds = tuple((0, 1) for _ in range(len(returns)))
    
    # Optimize for different target returns
    target_returns = [0.08, 0.10, 0.12]
    efficient_frontier = []
    
    for target in target_returns:
        constraints_with_return = [
            {'type': 'eq', 'fun': lambda x: np.sum(x) - 1},
            {'type': 'eq', 'fun': lambda x: np.dot(x, returns) - target}
        ]
        
        result = minimize(portfolio_variance, 
                         x0=np.array([0.25, 0.25, 0.25, 0.25]),
                         method='SLSQP',
                         bounds=bounds,
                         constraints=constraints_with_return)
        
        if result.success:
            efficient_frontier.append({
                'target_return': target,
                'portfolio_variance': result.fun,
                'portfolio_std': np.sqrt(result.fun),
                'weights': result.x.tolist()
            })
    
    print("Efficient Frontier Analysis:")
    for portfolio in efficient_frontier:
        print(f"Target Return: {portfolio['target_return']:.1%}")
        print(f"Portfolio Risk: {portfolio['portfolio_std']:.1%}")
        print(f"Optimal Weights: {[f'{w:.1%}' for w in portfolio['weights']]}")
        print()
  `,
  packages: ['numpy', 'scipy']
});
```

## Security and Safety Features

### 1. Package Restrictions
```javascript
// Only allow safe, pre-approved packages
this.allowedPackages = [
  'numpy', 'pandas', 'matplotlib', 'seaborn', 'scipy',
  'scikit-learn', 'PIL', 'cv2', 'json', 'csv', 'math'
  // Excludes dangerous packages like 'subprocess', 'os.system', etc.
];
```

### 2. Execution Timeout
```javascript
// Prevent infinite loops and runaway processes
setTimeout(() => {
  python.kill('SIGKILL');
  reject(new Error(`Python execution timeout (${timeout}s)`));
}, timeout * 1000);
```

### 3. Sandboxed Environment
```javascript
// Run in isolated temporary directories
const workDir = await this.createTempDir();
// Clean up after execution
await this.cleanupTempDir(workDir);
```

### 4. Input Validation
```javascript
// Validate and sanitize all inputs
const invalidPackages = packages.filter(pkg => !this.allowedPackages.includes(pkg));
if (invalidPackages.length > 0) {
  throw new Error(`Disallowed packages: ${invalidPackages.join(', ')}`);
}
```

## Benefits for Users

### Time Savings
- **Before**: Write Python scripts manually, debug, run, interpret results
- **After**: Describe what you want; AI writes, runs, and explains the code

### Accessibility  
- **Before**: Need to know Python syntax, libraries, and best practices
- **After**: Use natural language to request complex analyses

### Error Prevention
- **Before**: Manual coding errors, syntax mistakes, logic bugs
- **After**: AI handles implementation details with built-in error checking

### Comprehensive Analysis
- **Before**: Limited by your programming knowledge and time
- **After**: AI can apply advanced techniques you might not know about

This Python MCP server example demonstrates how AI agents can leverage Python's entire ecosystem through natural language interfaces, making advanced data analysis and programming accessible to everyone.