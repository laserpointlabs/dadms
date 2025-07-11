#!/usr/bin/env node

const axios = require('axios');

const API_URL = 'http://localhost:3001';

async function verifyTestExecution() {
    console.log('🔍 Verifying LLM Test Execution...\n');

    try {
        // 1. Check service health
        console.log('1. Checking service health...');
        const healthResponse = await axios.get(`${API_URL}/health`);
        console.log('✅ Service is healthy:', healthResponse.data);

        // 2. Check available LLMs
        console.log('\n2. Checking available LLMs...');
        const llmsResponse = await axios.get(`${API_URL}/llms/available`);
        console.log('Available LLMs:', JSON.stringify(llmsResponse.data, null, 2));

        // 3. Check LLM configuration status
        console.log('\n3. Checking LLM configuration status...');
        const configResponse = await axios.get(`${API_URL}/llms/config-status`);
        console.log('LLM Config Status:', JSON.stringify(configResponse.data, null, 2));

        // 4. Get a test prompt
        console.log('\n4. Getting prompts...');
        const promptsResponse = await axios.get(`${API_URL}/prompts`);
        const prompts = promptsResponse.data.data;

        if (prompts.length === 0) {
            console.log('❌ No prompts found. Please create a prompt first.');
            return;
        }

        const testPrompt = prompts[0];
        console.log(`Found prompt: "${testPrompt.name}" (ID: ${testPrompt.id})`);

        // 5. Run a simple test
        console.log('\n5. Running a test with available LLMs...');
        const testRequest = {
            test_case_ids: testPrompt.test_cases.filter(tc => tc.enabled).map(tc => tc.id).slice(0, 1),
            llm_configs: [
                {
                    provider: 'openai',
                    model: 'gpt-3.5-turbo',
                    temperature: 0.7,
                    maxTokens: 100
                },
                {
                    provider: 'local',
                    model: 'ollama/mistral',
                    temperature: 0.7,
                    maxTokens: 100
                }
            ],
            enable_comparison: false
        };

        console.log('Test configuration:', JSON.stringify(testRequest, null, 2));
        console.log('\n⏳ Running test (this may take a few seconds)...');

        const testResponse = await axios.post(`${API_URL}/prompts/${testPrompt.id}/test`, testRequest);
        const testResults = testResponse.data.data;

        console.log('\n✅ Test completed successfully!');
        console.log('Total tests run:', testResults.summary.total);
        console.log('Passed:', testResults.summary.passed);
        console.log('Failed:', testResults.summary.failed);
        console.log('Execution time:', testResults.summary.execution_time_ms, 'ms');

        // Show individual test results
        console.log('\nDetailed Results:');
        testResults.results.forEach((result, index) => {
            const provider = result.llm_response?.provider || 'unknown';
            const model = result.llm_response?.model || 'unknown';
            const responseTime = result.llm_response?.response_time_ms || result.execution_time_ms;
            const preview = typeof result.actual_output === 'string' ? result.actual_output : JSON.stringify(result.actual_output);
            console.log(`\nTest ${index + 1}: ${result.test_case_name}`);
            console.log(`  Provider: ${provider} (${model})`);
            console.log(`  Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
            console.log(`  Response time: ${responseTime}ms`);
            console.log(`  Response preview: ${preview.substring(0, 100)}...`);
        });

        console.log('\n🎉 Verification complete! The LLM tests are working correctly.');

    } catch (error) {
        console.error('❌ Error during verification:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

// Run verification
verifyTestExecution(); 