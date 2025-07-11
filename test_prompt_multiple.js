#!/usr/bin/env node

const axios = require('axios');

const PROMPT_SERVICE_URL = 'http://localhost:3001';
const TEST_PROMPT_ID = '6779131e-6c00-4a39-8121-4efcd7f4705a';

async function testPrompt(testNumber) {
    console.log(`\n=== Test Run ${testNumber} ===`);

    try {
        const requestData = {
            llm_configs: [
                {
                    provider: 'openai',
                    model: 'gpt-3.5-turbo',
                    temperature: 0.7,
                    maxTokens: 100
                }
            ],
            test_case_ids: ['628ac5db-6c4b-44fe-a310-941715eeaa66'], // Basic Addition test
            enable_comparison: false
        };

        console.log('Sending request...');
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

        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(response.data, null, 2));

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

async function runMultipleTests() {
    console.log('Testing multiple prompt test runs...');

    const results = [];

    // Run 3 tests in sequence
    for (let i = 1; i <= 3; i++) {
        const result = await testPrompt(i);
        results.push(result);

        // Wait a bit between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n=== SUMMARY ===');
    results.forEach((result, index) => {
        console.log(`Test ${index + 1}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        if (!result.success) {
            console.log(`  Error: ${result.error}`);
        }
    });
}

runMultipleTests().catch(console.error);
