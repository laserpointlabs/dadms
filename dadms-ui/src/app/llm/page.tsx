"use client";

import { useEffect, useState } from "react";

// TODO: Future expansion: support agent personas, threads, and RAG data integration
// NOTE: For production, API keys should be stored in backend .env, not in the frontend or user input. User-supplied keys are for local/dev/testing only.

const PROVIDERS = [
    { id: "openai", name: "OpenAI GPT-4" },
    { id: "anthropic", name: "Anthropic Claude" },
    { id: "ollama", name: "Ollama (local)" },
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

    // Placeholder for backend integration
    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResponse(null);
        setTimeout(() => {
            setResponse(
                `Response from ${PROVIDERS.find(p => p.id === provider)?.name} (${model}):\n"${prompt}"\nThread: ${threadId || '[none]'}\n(This is a mock response. API key source: ${apiKeySource}, key: ${usedKey})`
            );
            setLoading(false);
        }, 1000);
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">LLM Playground</h1>
            <form onSubmit={handleSend} className="space-y-4 mb-6">
                <div>
                    <label className="block text-sm font-medium mb-1">Provider</label>
                    <select
                        className="w-full border rounded px-2 py-1"
                        value={provider}
                        onChange={e => setProvider(e.target.value)}
                    >
                        {PROVIDERS.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Model</label>
                    <select
                        className="w-full border rounded px-2 py-1"
                        value={model}
                        onChange={e => setModel(e.target.value)}
                        required
                    >
                        {models.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Thread</label>
                    <select
                        className="w-full border rounded px-2 py-1"
                        value={threadId}
                        onChange={e => setThreadId(e.target.value)}
                    >
                        <option value="">-- None --</option>
                        {MOCK_THREADS.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">API Key Source</label>
                    <select
                        className="w-full border rounded px-2 py-1"
                        value={apiKeySource}
                        onChange={e => setApiKeySource(e.target.value as any)}
                    >
                        <option value="backend">Backend .env (recommended)</option>
                        <option value="custom">Enter custom key</option>
                        <option value="system">Use system environment variable</option>
                    </select>
                </div>
                {apiKeySource === "custom" && (
                    <div>
                        <label className="block text-sm font-medium mb-1">API Key</label>
                        <input
                            type="password"
                            className="w-full border rounded px-2 py-1"
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                            placeholder="Enter your API key"
                            autoComplete="off"
                        />
                        <div className="text-xs text-gray-500 mt-1">For local/dev only. In production, keys are managed in backend .env.</div>
                    </div>
                )}
                {apiKeySource === "system" && (
                    <div className="text-xs text-gray-500 mt-1">
                        {SYSTEM_ENV_KEY
                            ? `System environment variable found: ${SYSTEM_ENV_KEY.slice(0, 6)}...`
                            : "No system environment variable found. Set NEXT_PUBLIC_OPENAI_API_KEY at build time."}
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium mb-1">Prompt</label>
                    <textarea
                        className="w-full border rounded px-2 py-1"
                        rows={4}
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="Ask a question or enter a prompt..."
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-1 rounded"
                    disabled={loading || !prompt.trim()}
                >
                    {loading ? "Sending..." : "Send"}
                </button>
            </form>
            <div className="bg-white rounded shadow p-4 min-h-[100px]">
                {error && <div className="text-red-600 mb-2">{error}</div>}
                {response && <pre className="whitespace-pre-wrap text-sm">{response}</pre>}
                {!response && !loading && <div className="text-gray-400 text-sm">Response will appear here.</div>}
            </div>
        </div>
    );
} 