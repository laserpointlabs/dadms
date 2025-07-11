#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testRerunScenario() {
    console.log('🔄 Testing the specific rerun scenario that fails...');

    try {
        // 1. Get the first available prompt
        console.log('1. Getting available prompts...');
        const promptsResponse = await axios.get(`${BASE_URL}/prompts`);
        const prompts = promptsResponse.data.data;

        if (prompts.length === 0) {
            console.log('❌ No prompts available for testing');
            return;
        }

        const testPrompt = prompts[0];
        console.log(`   ✅ Using prompt: ${testPrompt.name} (${testPrompt.id})`);

        // 2. Get enabled test cases
        const enabledTestCases = testPrompt.test_cases
            .filter(tc => tc.enabled)
            .map(tc => tc.id);

        if (enabledTestCases.length === 0) {
            console.log('❌ No enabled test cases found');
            return;
        }

        console.log(`   ✅ Found ${enabledTestCases.length} enabled test cases`);

        // Test configuration
        const testConfig = {
            test_case_ids: enabledTestCases,
            llm_configs: [{
                provider: 'openai',
                model: 'gpt-3.5-turbo',
                temperature: 0.7,
                maxTokens: 1000
            }]
        };

        // SCENARIO: Run test -> Clear -> Run test again

        // 3. First test run
        console.log('\n2. Running FIRST test...');
        try {
            const firstTestResponse = await axios.post(`${BASE_URL}/prompts/${testPrompt.id}/test`, testConfig);
            const firstResults = firstTestResponse.data.data;

            console.log('   ✅ First test completed successfully:');
            console.log(`      - Total: ${firstResults.summary.total}`);
            console.log(`      - Passed: ${firstResults.summary.passed}`);
            console.log(`      - Failed: ${firstResults.summary.failed}`);
            console.log(`      - Execution time: ${firstResults.summary.execution_time_ms}ms`);
        } catch (error) {
            console.log('   ❌ First test failed:', error.response?.data?.message || error.message);
            return;
        }

        // 4. Check test results exist
        console.log('\n3. Checking test results exist...');
        try {
            const resultsCheck = await axios.get(`${BASE_URL}/prompts/${testPrompt.id}/test-results?version=${testPrompt.version}`);
            console.log(`   ✅ Test results found: ${resultsCheck.data.data.results.length} results`);
        } catch (error) {
            console.log('   ❌ Failed to get test results:', error.response?.data?.message || error.message);
        }

        // 5. Clear test results
        console.log('\n4. Clearing test results...');
        try {
            await axios.delete(`${BASE_URL}/prompts/${testPrompt.id}/test-results?version=${testPrompt.version}`);
            console.log('   ✅ Test results cleared successfully');
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('   ✅ No test results to clear (404 handled gracefully)');
            } else {
                console.log('   ❌ Failed to clear test results:', error.response?.data?.message || error.message);
                return;
            }
        }

        // 6. Verify results are cleared
        console.log('\n5. Verifying test results are cleared...');
        try {
            const resultsCheck = await axios.get(`${BASE_URL}/prompts/${testPrompt.id}/test-results?version=${testPrompt.version}`);
            console.log('   ⚠️  Test results still exist after clearing:', resultsCheck.data.data.results.length);
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('   ✅ Test results properly cleared (404 response)');
            } else {
                console.log('   ❌ Unexpected error checking cleared results:', error.response?.data?.message || error.message);
            }
        }

        // 7. Second test run (this is where the failure typically occurs)
        console.log('\n6. Running SECOND test (this is where failure typically occurs)...');
        try {
            const secondTestResponse = await axios.post(`${BASE_URL}/prompts/${testPrompt.id}/test`, testConfig);
            const secondResults = secondTestResponse.data.data;

            console.log('   ✅ Second test completed successfully:');
            console.log(`      - Total: ${secondResults.summary.total}`);
            console.log(`      - Passed: ${secondResults.summary.passed}`);
            console.log(`      - Failed: ${secondResults.summary.failed}`);
            console.log(`      - Execution time: ${secondResults.summary.execution_time_ms}ms`);

            // Check if results structure is correct
            console.log('\n   📊 Analyzing second test results structure:');
            console.log(`      - Results array length: ${secondResults.results.length}`);
            console.log(`      - Summary object exists: ${!!secondResults.summary}`);

            // Check individual results
            secondResults.results.forEach((result, index) => {
                console.log(`      - Result ${index + 1}:`);
                console.log(`        • Test case: ${result.test_case_name}`);
                console.log(`        • Passed: ${result.passed}`);
                console.log(`        • Has LLM response: ${!!result.llm_response}`);
                console.log(`        • Has content: ${!!result.llm_response?.content}`);
                console.log(`        • Has actual_output: ${!!result.actual_output}`);
                console.log(`        • Has error: ${!!result.error}`);
                console.log(`        • Has error_message: ${!!result.error_message}`);
            });

        } catch (error) {
            console.log('   ❌ Second test failed:', error.response?.data?.message || error.message);
            console.log('   📋 Full error details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data
            });
            return;
        }

        // 8. Test a third run to see if the pattern continues
        console.log('\n7. Running THIRD test to check for pattern...');
        try {
            const thirdTestResponse = await axios.post(`${BASE_URL}/prompts/${testPrompt.id}/test`, testConfig);
            const thirdResults = thirdTestResponse.data.data;

            console.log('   ✅ Third test completed successfully:');
            console.log(`      - Total: ${thirdResults.summary.total}`);
            console.log(`      - Passed: ${thirdResults.summary.passed}`);
            console.log(`      - Failed: ${thirdResults.summary.failed}`);
            console.log(`      - Execution time: ${thirdResults.summary.execution_time_ms}ms`);

        } catch (error) {
            console.log('   ❌ Third test failed:', error.response?.data?.message || error.message);
        }

        console.log('\n🎉 Rerun scenario testing completed!');

    } catch (error) {
        console.error('❌ Test scenario failed:', error.message);
    }
}

// Run the test
testRerunScenario().catch(console.error); 