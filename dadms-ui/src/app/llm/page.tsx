"use client";

import { useEffect, useState } from "react";

// TODO: Future expansion: support agent personas, threads, and RAG data integration
// NOTE: For production, API keys should be stored in backend .env, not in the frontend or user input. User-supplied keys are for local/dev/testing only.

const PROVIDERS = [
    { id: "openai", name: "OpenAI GPT-4", icon: "🤖", status: "available" },
    { id: "anthropic", name: "Anthropic Claude", icon: "🧠", status: "available" },
    { id: "ollama", name: "Ollama (local)", icon: "🏠", status: "offline" },
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

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">LLM Playground</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Test and experiment with AI models for decision intelligence
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className={`status-indicator ${selectedProvider?.status === 'available' ? 'status-active' : 'status-inactive'}`} />
                            {selectedProvider?.name || 'No provider'} {selectedProvider?.status === 'available' ? 'Ready' : 'Offline'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Configuration Panel */}
            <div className="bg-gray-50 border-b border-gray-200 p-4">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Provider Selection */}
                    <div className="card p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">AI Provider</label>
                        <select
                            className="input text-sm"
                            value={provider}
                            onChange={(e) => setProvider(e.target.value)}
                        >
                            {PROVIDERS.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.icon} {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Model Selection */}
                    <div className="card p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                        <select
                            className="input text-sm"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                        >
                            {models.map((m) => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>

                    {/* Thread Context */}
                    <div className="card p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Context Thread</label>
                        <select
                            className="input text-sm"
                            value={threadId}
                            onChange={(e) => setThreadId(e.target.value)}
                        >
                            <option value="">No thread context</option>
                            {MOCK_THREADS.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* API Key Source */}
                    <div className="card p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">API Key Source</label>
                        <select
                            className="input text-sm"
                            value={apiKeySource}
                            onChange={(e) => setApiKeySource(e.target.value as "backend" | "custom" | "system")}
                        >
                            <option value="backend">Backend Environment</option>
                            <option value="system">System Environment</option>
                            <option value="custom">Custom Key</option>
                        </select>
                        {apiKeySource === "custom" && (
                            <input
                                type="password"
                                className="input text-sm mt-2"
                                placeholder="Enter API key..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                        )}
                    </div>
                </div>

                {/* Key Status */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-blue-600">🔑</span>
                        <span className="font-medium text-blue-800">API Key:</span>
                        <span className="text-blue-700">{usedKey}</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Input Panel */}
                <div className="w-1/2 flex flex-col border-r border-gray-200">
                    <div className="p-4 border-b border-gray-200 bg-white">
                        <h3 className="text-lg font-semibold text-gray-900">Input</h3>
                        <p className="text-sm text-gray-600">Enter your prompt or question</p>
                    </div>
                    <div className="flex-1 p-4">
                        <textarea
                            className="input h-full resize-none"
                            placeholder="Enter your prompt here... For example: 'Analyze the trade-offs between Option A and Option B for our UAV decision.'"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-xs text-gray-500">
                                Characters: {prompt.length} | Estimated tokens: ~{Math.ceil(prompt.length / 4)}
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={!prompt.trim() || loading}
                                className="btn-primary"
                            >
                                {loading ? (
                                    <>
                                        <div className="loading-spinner" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        ⚡ Generate Response
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Output Panel */}
                <div className="w-1/2 flex flex-col">
                    <div className="p-4 border-b border-gray-200 bg-white">
                        <h3 className="text-lg font-semibold text-gray-900">Response</h3>
                        <p className="text-sm text-gray-600">AI-generated output</p>
                    </div>
                    <div className="flex-1 p-4 bg-gray-50">
                        {error && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <span className="text-red-600">❌</span>
                                    <span className="text-sm font-medium text-red-800">{error}</span>
                                </div>
                            </div>
                        )}

                        {loading ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="text-center">
                                    <div className="loading-spinner mx-auto mb-3" />
                                    <p className="text-gray-600">Generating response...</p>
                                </div>
                            </div>
                        ) : response ? (
                            <div className="card p-4">
                                <div className="prose prose-sm max-w-none">
                                    {response.split('\n').map((line, i) => (
                                        <p key={i} className="mb-2 text-gray-700 leading-relaxed">
                                            {line}
                                        </p>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>Generated by {model}</span>
                                        <span>Response time: ~1.5s</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                                    🤖
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to generate</h3>
                                <p className="text-gray-600">
                                    Enter a prompt and click Generate Response to test the AI model.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 