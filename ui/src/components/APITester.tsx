import { Box, Button, CircularProgress, Paper, Typography } from '@mui/material';
import React, { useState } from 'react';
import microservicesApi from '../services/microservices-api';

const APITester: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const testAPI = async () => {
        console.log('🧪 Starting API test...');
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // Test the exact same call that the UI makes
            const testRequest = {
                test_case_ids: ['d8b169a7-e55a-4826-94f6-452bc645893e'],
                llm_configs: [
                    {
                        provider: 'openai' as const,
                        model: 'gpt-3.5-turbo',
                        maxTokens: 50,
                        temperature: 0.7
                    }
                ],
                enable_comparison: false
            };

            console.log('🧪 Making API call with:', testRequest);
            const response = await microservicesApi.promptService.testPrompt(
                '3847f739-0f95-4257-a4aa-54cd098a0acf',
                testRequest
            );

            console.log('🧪 API Response received:', response);
            console.log('🧪 Response status:', response.status);
            console.log('🧪 Response data:', response.data);
            console.log('🧪 Response data success:', response.data.success);
            console.log('🧪 Response data.data:', response.data.data);

            setResult({
                status: response.status,
                success: response.data.success,
                hasData: !!response.data.data,
                dataKeys: response.data.data ? Object.keys(response.data.data) : [],
                resultsCount: response.data.data?.results?.length || 0,
                fullResponse: response.data
            });

        } catch (err) {
            console.error('🧪 API Error:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const testHealthAPI = async () => {
        console.log('🧪 Testing health endpoint...');
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await microservicesApi.healthService.checkAllServices();
            console.log('🧪 Health Response:', response);
            setResult({
                healthCheck: true,
                services: response,
                allHealthy: Object.values(response).every((service: any) => service.healthy)
            });
        } catch (err) {
            console.error('🧪 Health Check Error:', err);
            setError(err instanceof Error ? err.message : 'Health check failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper sx={{ p: 3, m: 2 }}>
            <Typography variant="h5" gutterBottom>
                🧪 API Tester
            </Typography>

            <Box sx={{ mb: 2 }}>
                <Button
                    variant="contained"
                    onClick={testHealthAPI}
                    disabled={loading}
                    sx={{ mr: 2 }}
                >
                    Test Health API
                </Button>
                <Button
                    variant="contained"
                    onClick={testAPI}
                    disabled={loading}
                    color="secondary"
                >
                    Test Prompt API
                </Button>
            </Box>

            {loading && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    <Typography>Testing API...</Typography>
                </Box>
            )}

            {error && (
                <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText', mb: 2 }}>
                    <Typography variant="h6">Error:</Typography>
                    <Typography>{error}</Typography>
                </Paper>
            )}

            {result && (
                <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                    <Typography variant="h6">Result:</Typography>
                    <pre style={{ overflow: 'auto', maxHeight: '400px' }}>
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </Paper>
            )}
        </Paper>
    );
};

export default APITester;
