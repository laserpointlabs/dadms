# UI Testing Guide for DADM Prompt Manager

## Overview
This guide explains how to effectively test prompts using the DADM UI with OpenAI and Ollama.

## Setting Up

### 1. Environment Variables
First, ensure your API keys are set:

```bash
# For OpenAI (if you want to test with GPT models)
export OPENAI_API_KEY=your-openai-api-key-here

# For Anthropic (optional)
export ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

### 2. Start Ollama
Make sure Ollama is running locally:
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start it
ollama serve

# Pull models you want to test with
ollama pull mistral
ollama pull llama2
```

## Using the UI for Testing

### Step 1: Create a Test Prompt

1. Click **"Create Prompt"** in the UI
2. Fill in the form:
   - **Name**: Give it a descriptive name (e.g., "Sentiment Analyzer")
   - **Prompt Text**: Use `{variable}` syntax for inputs
     ```
     Analyze the sentiment of this text: {text}
     Return only: "positive", "negative", or "neutral"
     ```
   - **Type**: Choose "simple" for basic prompts
   - **Tags**: Add relevant tags for organization

### Step 2: Add Test Cases

1. In the create/edit dialog, click **"Add Test Case"**
2. For each test case:
   - **Name**: Descriptive name (e.g., "Positive Sentiment Test")
   - **Input**: JSON format matching your variables
     ```json
     {
       "text": "I love this product! It's amazing!"
     }
     ```
   - **Expected Output**: What you expect the LLM to return
     ```json
     {
       "sentiment": "positive"
     }
     ```
   - **Enabled**: Toggle to include/exclude from tests

### Step 3: Configure LLMs for Testing

1. Click **"Test"** on your prompt card
2. In the test dialog, go to the **"Configuration"** tab
3. Add LLM configurations:
   - Click **"Add LLM Config"**
   - Select provider and model:
     - **OpenAI**: gpt-3.5-turbo, gpt-4
     - **Local (Ollama)**: ollama/mistral, ollama/llama2
   - Set temperature (0.0-1.0, lower = more consistent)
   - Set max tokens (response length limit)

### Step 4: Run Tests

1. Select which test cases to run (checked by default)
2. Enable **"Compare Responses"** to see differences between LLMs
3. Click **"Run Tests"**
4. Wait for results (may take 10-30 seconds)

### Step 5: Review Results

The results show:
- **Summary**: Total tests, passed/failed, execution time
- **Individual Results**: For each test case:
  - Pass/Fail status
  - Actual LLM response
  - Comparison score (0-100%)
  - Execution time
- **LLM Comparisons**: Side-by-side results from different models

## Understanding Test Results

### Pass/Fail Criteria
- **PASSED**: Comparison score ≥ 70% (configurable)
- **FAILED**: Score < 70% or error occurred

### Comparison Scores
- **100%**: Exact match with expected output
- **70-99%**: Similar but not exact (acceptable)
- **< 70%**: Significantly different (needs review)

### Common Issues and Solutions

1. **All tests failing with low scores**
   - Expected output may be too specific
   - LLM responses often include extra text
   - Solution: Make expected output more flexible

2. **Inconsistent results between runs**
   - High temperature causes variability
   - Solution: Lower temperature to 0.3 or less

3. **OpenAI tests not running**
   - API key not set or invalid
   - Solution: Check environment variable

4. **Ollama tests failing**
   - Ollama not running or model not downloaded
   - Solution: Start Ollama and pull required models

## Best Practices

### 1. Start Simple
- Begin with basic prompts and clear expected outputs
- Test with one LLM first, then add more

### 2. Use Multiple Test Cases
- Test edge cases and variations
- Include both positive and negative examples

### 3. Compare Models
- Run the same tests on different models
- Note which models work best for your use case

### 4. Iterate on Prompts
- Use test results to refine your prompts
- Lower temperature for more consistent results
- Be specific about output format

### 5. Save Configurations
- Click **"Save Config"** to remember your LLM settings
- Configurations are saved per prompt version

## Running Multiple Iterations

For more thorough testing, use the command-line test suite:

```bash
# Run comprehensive tests
./test-prompt-suite.js

# This will:
# - Create test prompts automatically
# - Run multiple iterations (you choose how many)
# - Show consistency analysis
# - Display aggregate statistics
```

## Example Test Scenarios

### 1. Math Problem Solver
```
Prompt: Solve this math problem: {problem}
Return only the numeric answer.

Test Case:
Input: { "problem": "2 + 2" }
Expected: { "answer": 4 }
```

### 2. JSON Extractor
```
Prompt: Extract information from this text: {text}
Return as JSON with "name" and "age" fields.

Test Case:
Input: { "text": "John is 25 years old" }
Expected: { "name": "John", "age": 25 }
```

### 3. Classification Task
```
Prompt: Classify this email as: spam, important, or normal
Email: {email_text}

Test Case:
Input: { "email_text": "Congratulations! You've won $1,000,000!" }
Expected: { "classification": "spam" }
```

## Troubleshooting

### Error: "Failed to test prompt"
- Check if prompt service is running (port 3001)
- Verify LLM configurations are correct
- Check console for detailed error messages

### Error: "No test cases found"
- Ensure test cases are enabled
- Add at least one test case to the prompt

### Results not saving
- Database connection issue
- Check PostgreSQL is running
- Restart prompt service if needed

## Tips for Better Testing

1. **Be explicit about output format** - Tell the LLM exactly how to respond
2. **Use lower temperatures** for consistent testing (0.3 or less)
3. **Test edge cases** - Empty inputs, long inputs, invalid inputs
4. **Version your prompts** - Create new versions as you iterate
5. **Review test history** - Learn from past test runs

## Next Steps

1. Start with the UI for simple testing
2. Use the command-line suite for bulk testing
3. Analyze results to improve prompts
4. Save successful configurations
5. Create more complex multi-step prompts 