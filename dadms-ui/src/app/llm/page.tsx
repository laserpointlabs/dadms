"use client";

import { useEffect, useState } from "react";
import { Alert } from '../../components/shared/Alert';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { CodiconName, Icon } from '../../components/shared/Icon';
import { LoadingState } from '../../components/shared/LoadingState';
import { PageContent, PageLayout } from '../../components/shared/PageLayout';

// TODO: Future expansion: support agent personas, threads, and RAG data integration
// NOTE: For production, API keys should be stored in backend .env, not in the frontend or user input. User-supplied keys are for local/dev/testing only.

interface Provider {
    id: string;
    name: string;
    icon: CodiconName;
    status: 'available' | 'offline';
}

const PROVIDERS: Provider[] = [
    { id: "openai", name: "OpenAI GPT-4", icon: "robot", status: "available" },
    { id: "anthropic", name: "Anthropic Claude", icon: "lightbulb", status: "available" },
    { id: "ollama", name: "Ollama (local)", icon: "pulse", status: "offline" },
];

const MOCK_MODELS: { [key: string]: string[] } = {
    openai: ["gpt-3.5-turbo", "gpt-4", "gpt-4o"],
    anthropic: ["claude-2", "claude-3-opus"],
    ollama: ["llama2", "mistral", "phi3"],
};

const SYSTEM_ENV_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || "";

// Mock thread data for selection
const MOCK_THREADS = [
    { id: "thread-1", name: "Project Kickoff" },
    { id: "thread-2", name: "UAV Analysis" },
    { id: "thread-3", name: "General Discussion" },
];

export default function LLMPlaygroundPage() {
    const [provider, setProvider] = useState(PROVIDERS[0].id);
    const [model, setModel] = useState("");
    const [models, setModels] = useState<string[]>([]);
    const [prompt, setPrompt] = useState("");
    const [response, setResponse] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState<string>("");
    const [apiKeySource, setApiKeySource] = useState<"backend" | "custom" | "system">("backend");
    const [threadId, setThreadId] = useState<string>("");

    // Placeholder for dynamic model fetching
    useEffect(() => {
        setModels(MOCK_MODELS[provider] || []);
        setModel(MOCK_MODELS[provider]?.[0] || "");
    }, [provider]);

    // Determine which key to use
    let usedKey = "[backend .env]";
    if (apiKeySource === "custom") usedKey = apiKey ? "[custom key]" : "[none]";
    if (apiKeySource === "system") usedKey = SYSTEM_ENV_KEY ? "[system env var]" : "[not set]";

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            setResponse(`Mock response from ${model} for prompt: "${prompt.substring(0, 50)}..."`);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to generate response');
        } finally {
            setLoading(false);
        }
    };

    const selectedProvider = PROVIDERS.find(p => p.id === provider);

    const pageActions = (
        <div className="flex items-center gap-2">
            <Button
                variant="secondary"
                size="sm"
                leftIcon="settings-gear"
                onClick={() => { }}
            >
                Settings
            </Button>
        </div>
    );

    return (
        <PageLayout
            title="LLM Playground"
            subtitle="Test and experiment with AI models for decision intelligence"
            icon="beaker"
            actions={pageActions}
            status={{
                text: selectedProvider?.status === 'available' ? `${selectedProvider.name} Ready` : 'Provider Offline',
                type: selectedProvider?.status === 'available' ? 'active' : 'inactive'
            }}
        >
            {/* Configuration Panel */}
            <div className="bg-theme-surface border-b border-theme-border">
                <PageContent padding="sm" spacing="none">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Provider Selection */}
                        <Card variant="default" padding="sm">
                            <label className="block text-sm font-medium text-theme-text-secondary mb-2">AI Provider</label>
                            <select
                                className="w-full bg-theme-input-bg border border-theme-input-border rounded px-3 py-2 text-theme-text-primary text-sm focus:border-theme-border-focus focus:outline-none"
                                value={provider}
                                onChange={(e) => setProvider(e.target.value)}
                            >
                                {PROVIDERS.map((p) => (
                                    <option key={p.id} value={p.id} className="bg-theme-input-bg text-theme-text-primary">
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </Card>

                        {/* Model Selection */}
                        <Card variant="default" padding="sm">
                            <label className="block text-sm font-medium text-theme-text-secondary mb-2">Model</label>
                            <select
                                className="w-full bg-theme-input-bg border border-theme-input-border rounded px-3 py-2 text-theme-text-primary text-sm focus:border-theme-border-focus focus:outline-none"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                            >
                                {models.map((m) => (
                                    <option key={m} value={m} className="bg-theme-input-bg text-theme-text-primary">
                                        {m}
                                    </option>
                                ))}
                            </select>
                        </Card>

                        {/* Context Thread */}
                        <Card variant="default" padding="sm">
                            <label className="block text-sm font-medium text-theme-text-secondary mb-2">Context Thread</label>
                            <select
                                className="w-full bg-theme-input-bg border border-theme-input-border rounded px-3 py-2 text-theme-text-primary text-sm focus:border-theme-border-focus focus:outline-none"
                                value={threadId}
                                onChange={(e) => setThreadId(e.target.value)}
                            >
                                <option value="" className="bg-theme-input-bg text-theme-text-primary">No thread context</option>
                                {MOCK_THREADS.map((t) => (
                                    <option key={t.id} value={t.id} className="bg-theme-input-bg text-theme-text-primary">{t.name}</option>
                                ))}
                            </select>
                        </Card>

                        {/* API Key Source */}
                        <Card variant="default" padding="sm">
                            <label className="block text-sm font-medium text-theme-text-secondary mb-2">API Key Source</label>
                            <select
                                className="w-full bg-theme-input-bg border border-theme-input-border rounded px-3 py-2 text-theme-text-primary text-sm focus:border-theme-border-focus focus:outline-none"
                                value={apiKeySource}
                                onChange={(e) => setApiKeySource(e.target.value as "backend" | "custom" | "system")}
                            >
                                <option value="backend" className="bg-theme-input-bg text-theme-text-primary">Backend Environment</option>
                                <option value="system" className="bg-theme-input-bg text-theme-text-primary">System Environment</option>
                                <option value="custom" className="bg-theme-input-bg text-theme-text-primary">Custom Key</option>
                            </select>
                            {apiKeySource === "custom" && (
                                <input
                                    type="password"
                                    placeholder="Enter API key..."
                                    className="w-full bg-theme-input-bg border border-theme-input-border rounded px-3 py-2 text-theme-text-primary text-sm mt-2 focus:border-theme-border-focus focus:outline-none"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                />
                            )}
                        </Card>
                    </div>
                </PageContent>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden bg-theme-bg-primary">
                {/* Input Section */}
                <div className="w-1/2 flex flex-col border-r border-theme-border">
                    <div className="p-4 border-b border-theme-border bg-theme-surface">
                        <h3 className="text-lg font-semibold text-theme-text-primary">Input</h3>
                        <p className="text-sm text-theme-text-secondary">Enter your prompt or question</p>
                    </div>
                    <div className="flex-1 p-4">
                        <textarea
                            className="w-full h-full bg-theme-input-bg border border-theme-input-border rounded-lg p-4 text-theme-text-primary resize-none focus:border-theme-border-focus focus:outline-none"
                            placeholder="Enter your prompt here..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                        <div className="mt-2 flex items-center justify-between">
                            <div className="text-xs text-theme-text-muted">
                                {prompt.length} characters
                            </div>
                            <Button
                                variant="primary"
                                leftIcon="arrow-right"
                                onClick={handleSubmit}
                                disabled={!prompt.trim() || loading}
                                loading={loading}
                            >
                                Generate
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Response Section */}
                <div className="w-1/2 flex flex-col">
                    <div className="p-4 border-b border-theme-border bg-theme-surface">
                        <h3 className="text-lg font-semibold text-theme-text-primary">Response</h3>
                        <p className="text-sm text-theme-text-secondary">AI-generated output</p>
                    </div>
                    <div className="flex-1 p-6 bg-theme-bg-secondary">
                        {loading ? (
                            <LoadingState size="lg" text="Generating response..." />
                        ) : response ? (
                            <div>
                                {response.split('\n').map((paragraph, i) => (
                                    <p key={i} className="mb-2 text-theme-text-primary leading-relaxed">
                                        {paragraph}
                                    </p>
                                ))}

                                <div className="mt-4 pt-4 border-t border-theme-border">
                                    <div className="flex items-center justify-between text-xs text-theme-text-muted">
                                        <span>Model: {model}</span>
                                        <span>Provider: {selectedProvider?.name}</span>
                                        <span>Generated: Just now</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-center">
                                <div>
                                    <Icon name="robot" size="xl" className="text-theme-text-muted mb-4" />
                                    <h3 className="text-lg font-medium text-theme-text-primary mb-2">Ready to generate</h3>
                                    <p className="text-theme-text-secondary">
                                        Enter a prompt and click Generate to get started
                                    </p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <Alert variant="error" title="Generation Error" className="mt-4">
                                {error}
                            </Alert>
                        )}
                    </div>
                </div>
            </div>
        </PageLayout>
    );
} 