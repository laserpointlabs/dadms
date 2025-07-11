#!/usr/bin/env node

const axios = require('axios');

const PROMPT_SERVICE_URL = 'http://localhost:3001';
const TEST_PROMPT_ID = 'a64e7c47-d6fc-4440-8e06-092fd2afa9d1';

async function clearTestResults() {
    console.log('=== Clearing Test Results ===');
    try {
        const response = await axios.delete(`${PROMPT_SERVICE_URL}/prompts/${TEST_PROMPT_ID}/test-results`);
        console.log('Clear results response:', response.status, response.data);
        return true;
    } catch (error) {
        console.error('Error clearing results:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return false;
    }
}

async function getTestResults() {
    console.log('=== Getting Test Results ===');
    try {
        const response = await axios.get(`${PROMPT_SERVICE_URL}/prompts/${TEST_PROMPT_ID}/test-results`);
        console.log('Get results response:', response.status);
        console.log('Results count:', response.data?.data?.results?.length || 0);
        return response.data;
    } catch (error) {
        console.error('Error getting results:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return null;
    }
}

async function testPrompt(testNumber) {
    console.log(`\n=== Test Run ${testNumber} ===`);

    try {
        const requestData = {
            llm_configs: [
                {
                    provider: 'mock',
                    model: 'mock-gpt',
                    temperature: 0.7,
                    maxTokens: 1000
                }
            ],
            test_case_ids: ['6e4eaedc-1726-4da9-9832-f0921ee7ad9d'],
            enable_comparison: false
        };

        console.log('Sending test request...');
        const response = await axios.post(
            `${PROMPT_SERVICE_URL}/prompts/${TEST_PROMPT_ID}/test`,
            requestData,
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 second timeout
            }
        );

        console.log('Test response status:', response.status);
        console.log('Test passed:', response.data?.data?.summary?.passed || 0);
        console.log('Test failed:', response.data?.data?.summary?.failed || 0);

        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error in test run:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return { success: false, error: error.message };
    }
}

async function runClearAndTestScenario() {
    console.log('Testing clear and multiple test runs scenario...');

    // 1. Get initial results
    console.log('\n1. Get initial test results...');
    await getTestResults();

    // 2. Clear results
    console.log('\n2. Clear test results...');
    const clearSuccess = await clearTestResults();
    if (!clearSuccess) {
        console.log('Clear failed, continuing anyway...');
    }

    // 3. Verify results are cleared
    console.log('\n3. Verify results are cleared...');
    await getTestResults();

    // 4. Run multiple tests
    console.log('\n4. Run multiple tests...');
    const testResults = [];

    for (let i = 1; i <= 3; i++) {
        const result = await testPrompt(i);
        testResults.push(result);

        // Get results after each test
        console.log(`\n--- Results after test ${i} ---`);
        await getTestResults();

        // Wait a bit between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n=== FINAL SUMMARY ===');
    testResults.forEach((result, index) => {
        console.log(`Test ${index + 1}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        if (!result.success) {
            console.log(`  Error: ${result.error}`);
        }
    });

    // Final results check
    console.log('\n5. Final results check...');
    await getTestResults();
}

runClearAndTestScenario().catch(console.error);
