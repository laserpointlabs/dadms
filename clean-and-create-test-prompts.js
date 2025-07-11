#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test prompts to create
const TEST_PROMPTS = [
    {
        name: 'Simple Math Calculator',
        text: 'Calculate the result of this mathematical expression: {expression}. Provide the answer as a number and show your work.',
        type: 'simple',
        tags: ['math', 'calculation', 'test'],
        test_cases: [
            {
                name: 'Basic Addition',
                input: { expression: '5 + 3' },
                expected_output: { result: 8, work: '5 + 3 = 8' },
                enabled: true
            },
            {
                name: 'Multiplication',
                input: { expression: '7 * 6' },
                expected_output: { result: 42, work: '7 * 6 = 42' },
                enabled: true
            }
        ]
    },
    {
        name: 'Text Sentiment Analyzer',
        text: 'Analyze the sentiment of this text: "{text}". Return a JSON object with sentiment (positive/negative/neutral) and confidence score.',
        type: 'tool-aware',
        tags: ['sentiment', 'analysis', 'nlp', 'test'],
        test_cases: [
            {
                name: 'Positive Text',
                input: { text: 'I love this amazing product!' },
                expected_output: { sentiment: 'positive', confidence: 0.9 },
                enabled: true
            },
            {
                name: 'Negative Text',
                input: { text: 'This is terrible and disappointing.' },
                expected_output: { sentiment: 'negative', confidence: 0.8 },
                enabled: true
            },
            {
                name: 'Neutral Text',
                input: { text: 'The weather is cloudy today.' },
                expected_output: { sentiment: 'neutral', confidence: 0.7 },
                enabled: true
            }
        ]
    },
    {
        name: 'Data Summary Generator',
        text: 'Summarize this data: {data}. Provide key statistics including count, average, min, max, and notable patterns.',
        type: 'workflow-aware',
        tags: ['data', 'summary', 'statistics', 'test'],
        test_cases: [
            {
                name: 'Number Array',
                input: { data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
                expected_output: {
                    count: 10,
                    average: 5.5,
                    min: 1,
                    max: 10,
                    patterns: ['ascending sequence']
                },
                enabled: true
            },
            {
                name: 'Mixed Data',
                input: { data: [100, 200, 150, 300, 250] },
                expected_output: {
                    count: 5,
                    average: 200,
                    min: 100,
                    max: 300,
                    patterns: ['varying values']
                },
                enabled: true
            }
        ]
    }
];

async function cleanupOldPrompts() {
    console.log('🧹 Cleaning up old prompts...');

    try {
        // Get all existing prompts
        const response = await axios.get(`${BASE_URL}/prompts`);
        const prompts = response.data.data;

        console.log(`Found ${prompts.length} existing prompts to delete`);

        // Delete each prompt
        for (const prompt of prompts) {
            try {
                await axios.delete(`${BASE_URL}/prompts/${prompt.id}`);
                console.log(`✅ Deleted prompt: ${prompt.name} (${prompt.id})`);
            } catch (error) {
                console.log(`❌ Failed to delete prompt ${prompt.name}:`, error.response?.data?.message || error.message);
            }
        }

        console.log('✅ Cleanup completed');
    } catch (error) {
        console.error('❌ Failed to cleanup prompts:', error.response?.data?.message || error.message);
        throw error;
    }
}

async function createTestPrompts() {
    console.log('🚀 Creating fresh test prompts...');

    const createdPrompts = [];

    for (const promptData of TEST_PROMPTS) {
        try {
            const response = await axios.post(`${BASE_URL}/prompts`, promptData);
            const createdPrompt = response.data.data;
            createdPrompts.push(createdPrompt);

            console.log(`✅ Created prompt: ${createdPrompt.name} (${createdPrompt.id})`);
            console.log(`   - Type: ${createdPrompt.type}`);
            console.log(`   - Test cases: ${createdPrompt.test_cases.length}`);
            console.log(`   - Tags: ${createdPrompt.tags.join(', ')}`);
        } catch (error) {
            console.error(`❌ Failed to create prompt "${promptData.name}":`, error.response?.data?.message || error.message);
        }
    }

    return createdPrompts;
}

async function runTestsOnPrompts(prompts) {
    console.log('🧪 Running initial tests on created prompts...');

    for (const prompt of prompts) {
        try {
            console.log(`\nTesting prompt: ${prompt.name}`);

            // Get enabled test case IDs
            const enabledTestCases = prompt.test_cases
                .filter(tc => tc.enabled)
                .map(tc => tc.id);

            if (enabledTestCases.length === 0) {
                console.log(`⚠️  No enabled test cases for ${prompt.name}`);
                continue;
            }

            // Run test with OpenAI
            const testRequest = {
                test_case_ids: enabledTestCases,
                llm_configs: [{
                    provider: 'openai',
                    model: 'gpt-3.5-turbo',
                    temperature: 0.7,
                    maxTokens: 1000
                }]
            };

            console.log(`   Running ${enabledTestCases.length} test cases...`);
            const testResponse = await axios.post(`${BASE_URL}/prompts/${prompt.id}/test`, testRequest);
            const results = testResponse.data.data;

            console.log(`   ✅ Test completed:`);
            console.log(`      - Total: ${results.summary.total}`);
            console.log(`      - Passed: ${results.summary.passed}`);
            console.log(`      - Failed: ${results.summary.failed}`);
            console.log(`      - Execution time: ${results.summary.execution_time_ms}ms`);

        } catch (error) {
            console.error(`   ❌ Test failed for ${prompt.name}:`, error.response?.data?.message || error.message);
        }
    }
}

async function verifyTestDeletionFix(prompts) {
    console.log('\n🔧 Verifying test deletion fix...');

    if (prompts.length === 0) {
        console.log('⚠️  No prompts available for testing deletion fix');
        return;
    }

    const testPrompt = prompts[0]; // Use first prompt for testing

    try {
        console.log(`\nTesting deletion fix with prompt: ${testPrompt.name}`);

        // 1. Check if test results exist
        console.log('1. Checking for existing test results...');
        try {
            const resultsResponse = await axios.get(`${BASE_URL}/prompts/${testPrompt.id}/test-results?version=${testPrompt.version}`);
            console.log('   ✅ Test results found');
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('   ℹ️  No test results found (expected if no tests run yet)');
            } else {
                console.log('   ❌ Error checking test results:', error.response?.data?.message || error.message);
            }
        }

        // 2. Try to clear test results (this should work with the fix)
        console.log('2. Testing test result deletion...');
        try {
            await axios.delete(`${BASE_URL}/prompts/${testPrompt.id}/test-results?version=${testPrompt.version}`);
            console.log('   ✅ Test results deletion completed successfully');
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('   ✅ No test results to delete (404 handled gracefully)');
            } else {
                console.log('   ❌ Test results deletion failed:', error.response?.data?.message || error.message);
            }
        }

        // 3. Check test history (should work with LEFT JOIN fix)
        console.log('3. Testing test history retrieval...');
        try {
            const historyResponse = await axios.get(`${BASE_URL}/prompts/${testPrompt.id}/test-history`);
            console.log(`   ✅ Test history retrieved successfully (${historyResponse.data.data.length} entries)`);
        } catch (error) {
            console.log('   ❌ Test history retrieval failed:', error.response?.data?.message || error.message);
        }

        console.log('\n🎉 Test deletion fix verification completed!');

    } catch (error) {
        console.error('❌ Test deletion fix verification failed:', error.response?.data?.message || error.message);
    }
}

async function main() {
    console.log('🧪 DADM Prompt Service Test Data Reset & Verification');
    console.log('='.repeat(60));

    try {
        // Step 1: Clean up old data
        await cleanupOldPrompts();

        console.log('\n');

        // Step 2: Create fresh test prompts
        const createdPrompts = await createTestPrompts();

        console.log('\n');

        // Step 3: Run initial tests
        await runTestsOnPrompts(createdPrompts);

        // Step 4: Verify test deletion fix
        await verifyTestDeletionFix(createdPrompts);

        console.log('\n✅ All operations completed successfully!');
        console.log('\nCreated prompts summary:');
        createdPrompts.forEach((prompt, index) => {
            console.log(`${index + 1}. ${prompt.name} (${prompt.id})`);
            console.log(`   - Type: ${prompt.type}`);
            console.log(`   - Test cases: ${prompt.test_cases.length}`);
        });

        console.log('\n🎯 You can now test the UI to verify:');
        console.log('   1. Prompts load correctly');
        console.log('   2. Tests can be run successfully');
        console.log('   3. Test results can be cleared without "unknown error"');
        console.log('   4. Multiple clear-and-rerun cycles work properly');

    } catch (error) {
        console.error('\n❌ Script failed:', error.message);
        process.exit(1);
    }
}

// Run the script
main().catch(console.error); 