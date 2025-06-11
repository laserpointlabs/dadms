# How to View Analysis Input and Output Data

## Overview

There are several ways to view the input and output data for any particular analysis in the DADM system. Each method provides different levels of detail and is suited for different use cases.

## Method 1: Detailed Analysis View (Recommended for Deep Inspection)

### Using the Analysis CLI Tool

The most comprehensive way to view full input and output data:

```bash
# First, get the analysis ID from a list
python scripts/analysis_cli.py list --limit 5

# Then show detailed information for a specific analysis
python scripts/analysis_cli.py show <analysis-id>
```

**Example:**
```bash
python scripts/analysis_cli.py show e8cdf0cf-6673-4bfb-beea-9b736386976b
```

**What you get:**
- Complete analysis metadata (ID, thread, session, process instance, task name, status, timestamps)
- Full JSON-formatted input data (task description, variables, context)
- Complete JSON-formatted output data (recommendations, assistant responses, thread IDs)
- Raw response data if available
- Source service information
- All tags and categorization

**Best for:** Debugging, detailed analysis review, understanding complete workflow context

## Method 2: Analysis List with Detail View (Quick Overview)

### Using the Main DADM Command

```bash
# List recent analyses with detailed summary
dadm analysis list --detailed --limit 3

# Filter and view specific analyses
dadm analysis list --process-id <process-id> --detailed
dadm analysis list --service "assistant/dadm-openai-assistant" --detailed
```

**What you get:**
- Analysis IDs and basic metadata
- Input data keys summary (first 5 keys)
- Output data keys summary (first 5 keys)
- Processing status (completed/pending tasks)
- OpenAI-specific information (thread IDs, assistant IDs)

**Best for:** Quick overview, identifying analyses of interest, monitoring processing status

## Method 3: Process-Specific Analysis View

### View All Analyses for a Specific Process

```bash
# Get analyses for a specific process instance
dadm analysis list --process-id 2b061e4a-46c8-11f0-9a4c-0242ac190006 --detailed

# Or using the CLI tool
python scripts/analysis_cli.py list --session-id 2b061e4a-46c8-11f0-9a4c-0242ac190006
```

**Best for:** Understanding the complete analysis flow for a specific workflow execution

## Method 4: Thread-Based Analysis View

### View Conversation-Based Analysis

```bash
# View analyses for a specific thread/conversation
python scripts/analysis_cli.py thread <thread-id> --verbose

# Example
python scripts/analysis_cli.py thread process_2b061e4a-46c8-11f0-9a4c-0242ac190006 --verbose
```

**Best for:** Following the conversation flow and understanding how analyses build on each other

## Method 5: Export for External Analysis

### Export Analysis Data

```bash
# Export analyses to JSON file for external analysis
python scripts/analysis_cli.py export output.json --limit 10
python scripts/analysis_cli.py export filtered_data.json --service "assistant/dadm-openai-assistant"
```

**Best for:** Data analysis, reporting, integration with external tools

## Real Example: Viewing UAS Decision Analysis

Based on the actual data in the system, here's how to view the comprehensive UAS decision analysis:

### Step 1: Find Available Analyses
```bash
python scripts/analysis_cli.py list --limit 5
```

Output shows analyses like:
- `e8cdf0cf-6673-4bfb-beea-9b736386976b` - WhitepaperGenerationTask
- `a4e1fcbe-1d0f-4719-a962-309ffa7ff374` - FinalRecommendationTask
- `c5fec767-5722-46b1-ba5e-8faba532ec7c` - SynthesisTask

### Step 2: View Detailed Analysis
```bash
python scripts/analysis_cli.py show e8cdf0cf-6673-4bfb-beea-9b736386976b
```

This reveals:
- **Input Data**: Complete task description, context variables, business/technical/risk recommendations
- **Output Data**: Generated whitepaper with executive summary, methodology, findings, recommendations
- **Metadata**: OpenAI thread IDs, assistant IDs, process context

### Step 3: View Process Context
```bash
dadm analysis list --process-id 2b061e4a-46c8-11f0-9a4c-0242ac190006 --detailed
```

Shows all related analyses in the decision process.

## Key Data Elements Available

### Input Data Typically Contains:
- **Task Description**: What the analysis is supposed to accomplish
- **Variables**: Context variables from the workflow
- **Previous Results**: Output from earlier analysis steps
- **Metadata**: Timestamps, identifiers, source information

### Output Data Typically Contains:
- **Recommendations**: Primary choices and reasoning
- **Analysis Results**: Detailed findings and evaluations
- **OpenAI Context**: Thread IDs for conversation continuation
- **Structured Data**: JSON-formatted results for further processing
- **Metadata**: Confidence levels, assumptions, risks

## Use Cases by Method

| Use Case | Recommended Method | Command |
|----------|-------------------|---------|
| Debug specific analysis | Method 1 | `python scripts/analysis_cli.py show <id>` |
| Quick status check | Method 2 | `dadm analysis list --detailed` |
| Process workflow review | Method 3 | `dadm analysis list --process-id <id>` |
| Conversation tracking | Method 4 | `python scripts/analysis_cli.py thread <id>` |
| Data export/reporting | Method 5 | `python scripts/analysis_cli.py export` |

## Integration with OpenAI Conversations

The analysis data includes OpenAI thread IDs that can be used to continue conversations:

```bash
# Extract OpenAI context
python scripts/extract_openai_threads.py --process-id <process-id>

# Continue OpenAI conversation
python scripts/interact_openai_thread.py --process-id <process-id> --message "Additional analysis question"
```

This provides seamless integration between stored analysis data and interactive AI conversations for further exploration and refinement.
