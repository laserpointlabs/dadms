#!/usr/bin/env node

const axios = require('axios');
const readline = require('readline');

const API_URL = 'http://localhost:3001';

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Test configuration
const TEST_CONFIG = {
    iterations: 3,  // Run each test this many times
    llmConfigs: [
        {
            provider: 'openai',
            model: 'gpt-3.5-turbo',
            temperature: 0.7,
            maxTokens: 500,
            apiKey: process.env.OPENAI_API_KEY
        },
        {
            provider: 'local',
            model: 'ollama/mistral',
            temperature: 0.7,
            maxTokens: 500
        }
    ]
};

// Utility functions
function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(title, 'bright');
    console.log('='.repeat(60));
}

function logSubSection(title) {
    console.log('\n' + '-'.repeat(40));
    log(title, 'cyan');
    console.log('-'.repeat(40));
}

async function askQuestion(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

// Create test prompts
async function createTestPrompts() {
    logSection('Creating Test Prompts');

    const testPrompts = [
        {
            name: "Simple Math Problem Solver",
            text: "Solve the following math problem and return the answer as a number only: {problem}",
            type: "simple",
            tags: ["math", "test"],
            test_cases: [
                {
                    name: "Basic Addition",
                    input: { problem: "2 + 2" },
                    expected_output: { answer: 4 },
                    enabled: true
                },
                {
                    name: "Multiplication",
                    input: { problem: "5 * 6" },
                    expected_output: { answer: 30 },
                    enabled: true
                }
            ],
            created_by: "test-suite"
        },
        {
            name: "Sentiment Analyzer",
            text: "Analyze the sentiment of the following text and respond with either 'positive', 'negative', or 'neutral': {text}",
            type: "simple",
            tags: ["sentiment", "test"],
            test_cases: [
                {
                    name: "Positive Sentiment",
                    input: { text: "I love this product! It's amazing!" },
                    expected_output: { sentiment: "positive" },
                    enabled: true
                },
                {
                    name: "Negative Sentiment",
                    input: { text: "This is terrible. I hate it." },
                    expected_output: { sentiment: "negative" },
                    enabled: true
                }
            ],
            created_by: "test-suite"
        },
        {
            name: "JSON Response Generator",
            text: "Extract the key information from this text and return as JSON with 'name' and 'age' fields: {text}",
            type: "simple",
            tags: ["json", "extraction", "test"],
            test_cases: [
                {
                    name: "Extract Person Info",
                    input: { text: "John is 25 years old" },
                    expected_output: { name: "John", age: 25 },
                    enabled: true
                }
            ],
            created_by: "test-suite"
        }
    ];

    const createdPrompts = [];

    for (const prompt of testPrompts) {
        try {
            const response = await axios.post(`${API_URL}/prompts`, prompt);
            createdPrompts.push(response.data.data);
            log(`✅ Created: ${prompt.name} (ID: ${response.data.data.id})`, 'green');
        } catch (error) {
            log(`❌ Failed to create ${prompt.name}: ${error.message}`, 'red');
        }
    }

    return createdPrompts;
}

// Run tests on a prompt
async function runPromptTests(prompt, iterations = 1) {
    logSubSection(`Testing: ${prompt.name}`);

    const allResults = [];

    for (let i = 0; i < iterations; i++) {
        log(`\nIteration ${i + 1} of ${iterations}`, 'yellow');

        try {
            const testRequest = {
                test_case_ids: prompt.test_cases.map(tc => tc.id),
                llm_configs: TEST_CONFIG.llmConfigs.filter(config => {
                    if (config.provider === 'openai' && !config.apiKey) {
                        log('⚠️  Skipping OpenAI (no API key)', 'yellow');
                        return false;
                    }
                    return true;
                }),
                enable_comparison: true
            };

            const response = await axios.post(
                `${API_URL}/prompts/${prompt.id}/test`,
                testRequest
            );

            const result = response.data.data;
            allResults.push(result);

            // Display results for this iteration
            displayTestResults(result, i + 1);

        } catch (error) {
            log(`❌ Test failed: ${error.response?.data?.error || error.message}`, 'red');
        }
    }

    return allResults;
}

// Display test results
function displayTestResults(testResult, iteration) {
    console.log('\n📊 Test Results:');

    // Summary
    const { summary } = testResult;
    console.log(`   Total Tests: ${summary.total}`);
    console.log(`   Passed: ${colors.green}${summary.passed}${colors.reset}`);
    console.log(`   Failed: ${colors.red}${summary.failed}${colors.reset}`);
    console.log(`   Execution Time: ${summary.execution_time_ms}ms`);

    if (summary.avg_comparison_score !== undefined) {
        const scoreColor = summary.avg_comparison_score >= 0.7 ? 'green' : 'red';
        console.log(`   Avg Score: ${colors[scoreColor]}${(summary.avg_comparison_score * 100).toFixed(1)}%${colors.reset}`);
    }

    // Individual test results
    console.log('\n   Test Cases:');
    for (const result of testResult.results) {
        const status = result.passed ? `${colors.green}✅ PASSED${colors.reset}` : `${colors.red}❌ FAILED${colors.reset}`;
        console.log(`   - ${result.test_case_name}: ${status}`);

        if (result.llm_response) {
            console.log(`     Provider: ${result.llm_response.provider} (${result.llm_response.model})`);
            console.log(`     Response: ${result.actual_output.substring(0, 100)}...`);
            console.log(`     Time: ${result.execution_time_ms}ms`);
        }

        if (result.error) {
            console.log(`     Error: ${colors.red}${result.error}${colors.reset}`);
        }
    }

    // Compare LLM responses if available
    if (testResult.llm_comparisons) {
        console.log('\n   LLM Comparisons:');
        for (const [llmKey, responses] of Object.entries(testResult.llm_comparisons)) {
            console.log(`   ${llmKey}:`);
            if (responses.length > 0) {
                const avgTime = responses.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) / responses.length;
                console.log(`     Avg Response Time: ${avgTime.toFixed(0)}ms`);
                console.log(`     Total Tokens: ${responses.reduce((sum, r) => sum + (r.usage?.total_tokens || 0), 0)}`);
            }
        }
    }
}

// Analyze results across multiple iterations
function analyzeMultipleIterations(allResults, promptName) {
    logSubSection(`Analysis for ${promptName}`);

    if (allResults.length === 0) return;

    // Aggregate statistics
    const stats = {
        totalTests: 0,
        totalPassed: 0,
        totalFailed: 0,
        avgExecutionTime: 0,
        consistencyScores: {}
    };

    const responsesByTestCase = {};

    for (const result of allResults) {
        stats.totalTests += result.summary.total;
        stats.totalPassed += result.summary.passed;
        stats.totalFailed += result.summary.failed;
        stats.avgExecutionTime += result.summary.execution_time_ms;

        // Track responses for consistency analysis
        for (const testResult of result.results) {
            const key = testResult.test_case_name;
            if (!responsesByTestCase[key]) {
                responsesByTestCase[key] = [];
            }
            responsesByTestCase[key].push(testResult.actual_output);
        }
    }

    stats.avgExecutionTime /= allResults.length;

    // Calculate consistency scores
    for (const [testCase, responses] of Object.entries(responsesByTestCase)) {
        const uniqueResponses = new Set(responses);
        const consistencyScore = 1 - (uniqueResponses.size - 1) / responses.length;
        stats.consistencyScores[testCase] = consistencyScore;
    }

    // Display analysis
    console.log('\n📈 Aggregate Statistics:');
    console.log(`   Total Iterations: ${allResults.length}`);
    console.log(`   Success Rate: ${((stats.totalPassed / stats.totalTests) * 100).toFixed(1)}%`);
    console.log(`   Avg Execution Time: ${stats.avgExecutionTime.toFixed(0)}ms`);

    console.log('\n🔄 Response Consistency:');
    for (const [testCase, score] of Object.entries(stats.consistencyScores)) {
        const scoreColor = score >= 0.8 ? 'green' : score >= 0.5 ? 'yellow' : 'red';
        console.log(`   ${testCase}: ${colors[scoreColor]}${(score * 100).toFixed(1)}%${colors.reset}`);
    }
}

// View test history
async function viewTestHistory(promptId) {
    try {
        const response = await axios.get(`${API_URL}/prompts/${promptId}/test-history`);
        const history = response.data.data;

        if (history.length === 0) {
            log('No test history found', 'yellow');
            return;
        }

        console.log('\n📜 Test History:');
        for (const entry of history.slice(0, 5)) {
            const date = new Date(entry.created_at).toLocaleString();
            const passRate = ((entry.passed_tests / entry.total_tests) * 100).toFixed(1);
            console.log(`   ${date} - v${entry.prompt_version} - ${passRate}% passed (${entry.passed_tests}/${entry.total_tests})`);
        }
    } catch (error) {
        log(`Failed to load test history: ${error.message}`, 'red');
    }
}

// Main test suite
async function runTestSuite() {
    logSection('🧪 Prompt Testing Suite');

    // Check for API keys
    if (!process.env.OPENAI_API_KEY) {
        log('⚠️  Warning: OPENAI_API_KEY not set. Will only test with Ollama.', 'yellow');
        log('   Set it with: export OPENAI_API_KEY=your-key-here\n', 'yellow');
    }

    // Create test prompts
    const prompts = await createTestPrompts();

    if (prompts.length === 0) {
        log('No prompts created. Exiting.', 'red');
        return;
    }

    // Ask user how many iterations
    const iterations = parseInt(await askQuestion('\nHow many test iterations per prompt? (default: 3): ')) || 3;

    // Run tests on each prompt
    for (const prompt of prompts) {
        const results = await runPromptTests(prompt, iterations);
        analyzeMultipleIterations(results, prompt.name);
        await viewTestHistory(prompt.id);
    }

    // Clean up option
    const cleanup = await askQuestion('\nDelete test prompts? (y/n): ');
    if (cleanup.toLowerCase() === 'y') {
        logSection('Cleaning Up');
        for (const prompt of prompts) {
            try {
                await axios.delete(`${API_URL}/prompts/${prompt.id}`);
                log(`✅ Deleted: ${prompt.name}`, 'green');
            } catch (error) {
                log(`❌ Failed to delete ${prompt.name}: ${error.message}`, 'red');
            }
        }
    }

    log('\n✨ Test suite completed!', 'green');
}

// Error handler
process.on('unhandledRejection', (error) => {
    log(`\n❌ Unhandled error: ${error.message}`, 'red');
    process.exit(1);
});

// Run the test suite
if (require.main === module) {
    runTestSuite().catch(error => {
        log(`\n❌ Fatal error: ${error.message}`, 'red');
        process.exit(1);
    });
} 