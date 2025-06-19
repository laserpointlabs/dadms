import {
    Clear,
    Download,
    History,
    OpenInNew,
    Person,
    Psychology,
    Refresh,
    Send
} from '@mui/icons-material';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    FormControl,
    IconButton,
    InputLabel,
    List,
    ListItem,
    MenuItem,
    Paper,
    Select,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    thread_id?: string;
    tokens?: number;
}

interface ThreadContext {
    id: string;
    openai_thread: string;
    openai_assistant: string;
    name: string;
    status: 'active' | 'completed' | 'error' | 'pending';
    created_at: string;
    last_activity: string;
    analysis_count: number;
    analysis_ids: string[];
    process_definition?: {
        name: string;
        version: number;
        key: string;
    };
}

const AIChat: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [threadsLoading, setThreadsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedThread, setSelectedThread] = useState<string>('');
    const [availableThreads, setAvailableThreads] = useState<ThreadContext[]>([]);
    const [chatMode, setChatMode] = useState<'standalone' | 'thread-context'>('standalone');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load thread messages when a thread is selected
    const loadThreadMessages = async (threadId: string) => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'}/api/analysis/threads/${threadId}/context`);
            const result = await response.json();

            if (result.success && result.data.messages) {
                // Convert OpenAI messages to our ChatMessage format
                const chatMessages: ChatMessage[] = result.data.messages
                    .reverse() // OpenAI returns newest first, we want oldest first
                    .map((msg: any) => ({
                        id: msg.id,
                        role: msg.role as 'user' | 'assistant',
                        content: msg.content.map((c: any) => c.text?.value || '').join(''),
                        timestamp: new Date(msg.created_at * 1000).toISOString(),
                        thread_id: threadId
                    }));

                // Add welcome message first, then thread messages
                setMessages([getWelcomeMessage(), ...chatMessages]);
                console.log(`Loaded ${chatMessages.length} messages from thread ${threadId}`);
            }
        } catch (err) {
            console.error('Error loading thread messages:', err);
            setError('Failed to load thread conversation history');
        } finally {
            setLoading(false);
        }
    };

    // Handle thread selection change
    const handleThreadChange = (newThreadId: string) => {
        setSelectedThread(newThreadId);
        if (newThreadId) {
            loadThreadMessages(newThreadId);
        } else {
            setMessages([getWelcomeMessage()]);
        }
    };

    // Fetch real thread data from API
    const fetchThreads = async () => {
        try {
            setThreadsLoading(true);
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'}/api/analysis/threads`);
            const result = await response.json();

            if (result.success) {
                setAvailableThreads(result.data);
                console.log(`Loaded ${result.data.length} thread combinations for AI Chat`);
            } else {
                console.error('Failed to fetch threads:', result.error);
                setError(`Failed to load threads: ${result.error}`);
            }
        } catch (err) {
            console.error('Error fetching threads for AI Chat:', err);
            setError('Failed to connect to thread API');
        } finally {
            setThreadsLoading(false);
        }
    };

    // Create a dynamic welcome message that updates with thread count
    const getWelcomeMessage = (): ChatMessage => ({
        id: 'welcome',
        role: 'assistant',
        content: `# Welcome to DADM AI Assistant! 🤖

I'm here to help you with:

## 🔍 **Analysis & Decision Support**
- Interpret analysis results
- Provide insights and recommendations
- Help understand complex data patterns

## 🧵 **Thread Context Integration**
- Discuss specific analysis threads from your system
- Review conversation history and outcomes
- Analyze thread performance and results

## 💡 **System Guidance**
- CLI command assistance
- Best practices recommendations
- Troubleshooting support

## 📊 **Data Visualization Help**
- Chart interpretation
- Statistical analysis explanation
- Reporting suggestions

**Choose a mode:**
- **Standalone**: General AI assistance
- **Thread Context**: Focus on specific analysis threads${availableThreads.length > 0 ? ` (${availableThreads.length} threads available)` : ' (loading threads...)'}

What would you like to explore today?`,
        timestamp: new Date().toISOString()
    });

    useEffect(() => {
        fetchThreads();
        setMessages([getWelcomeMessage()]);
    }, []); // Empty dependency array is intentional for initialization

    // Update welcome message when threads are loaded
    useEffect(() => {
        if (messages.length === 1 && messages[0].id === 'welcome') {
            setMessages([getWelcomeMessage()]);
        }
    }, [availableThreads.length]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;

        const userMessage: ChatMessage = {
            id: `msg_${Date.now()}`,
            role: 'user',
            content: inputMessage,
            timestamp: new Date().toISOString(),
            thread_id: chatMode === 'thread-context' ? selectedThread : undefined
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setLoading(true);

        try {
            if (chatMode === 'thread-context' && selectedThread) {
                // Real OpenAI API call for thread context mode
                const selectedThreadData = availableThreads.find(t => t.openai_thread === selectedThread);

                if (!selectedThreadData) {
                    throw new Error('Selected thread not found');
                }

                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'}/api/openai/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: inputMessage,
                        threadId: selectedThread,
                        assistantId: selectedThreadData.openai_assistant
                    })
                });

                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.error || 'Failed to get response from OpenAI');
                }

                const assistantMessage: ChatMessage = {
                    id: result.data.assistantMessage.id,
                    role: 'assistant',
                    content: result.data.assistantMessage.content,
                    timestamp: result.data.assistantMessage.timestamp,
                    thread_id: selectedThread
                };

                setMessages(prev => [...prev, assistantMessage]);
            } else {
                // Fallback to mock response for standalone mode
                await new Promise(resolve => setTimeout(resolve, 1500));

                const aiResponse = generateAIResponse(inputMessage, chatMode, selectedThread);

                const assistantMessage: ChatMessage = {
                    id: `msg_${Date.now() + 1}`,
                    role: 'assistant',
                    content: aiResponse,
                    timestamp: new Date().toISOString(),
                    thread_id: chatMode === 'thread-context' ? selectedThread : undefined,
                    tokens: Math.floor(Math.random() * 500) + 100
                };

                setMessages(prev => [...prev, assistantMessage]);
            }
        } catch (err) {
            console.error('Error sending message:', err);
            setError(err instanceof Error ? err.message : 'Failed to get AI response');
        } finally {
            setLoading(false);
        }
    };

    const generateAIResponse = (input: string, mode: string, threadId: string): string => {
        const lowerInput = input.toLowerCase();

        if (mode === 'thread-context') {
            if (!threadId) {
                return `# Thread Context Mode 🧵

Please select a thread from the dropdown above to get context-specific assistance. I can help you with:

- **Thread Analysis**: Detailed insights about specific analysis threads
- **Performance Review**: Understanding thread outcomes and effectiveness
- **Troubleshooting**: Identifying and resolving thread-specific issues
- **Best Practices**: Recommendations for optimizing thread usage

Choose a thread from the **${availableThreads.length} available threads** to get started!`;
            }

            const thread = availableThreads.find(t => t.openai_thread === threadId);
            if (thread) {
                if (lowerInput.includes('summary') || lowerInput.includes('overview')) {
                    return `# Thread Summary: ${thread.name}

## 📊 **Analysis Overview**
- **Thread ID**: ${thread.openai_thread}
- **Assistant**: ${thread.openai_assistant}
- **Analysis Count**: ${thread.analysis_count}
- **Status**: ${thread.status}
- **Created**: ${new Date(thread.created_at).toLocaleDateString()}

## 🔍 **Key Insights**
Based on the thread context, this analysis focused on ${thread.name.toLowerCase()}. The current status is **${thread.status}** with ${thread.analysis_count} related analyses.

## 💡 **Recommendations**
1. Review the final analysis outputs
2. Consider implementing suggested actions
3. Monitor performance metrics
4. Schedule follow-up analysis if needed

Would you like me to dive deeper into any specific aspect of this analysis?`;
                }

                if (lowerInput.includes('error') || lowerInput.includes('problem')) {
                    return `# Troubleshooting Analysis: ${thread.name}

I'll help you identify and resolve issues with this analysis thread.

## 🔍 **Common Issues to Check**

### Data Quality
- Missing or incomplete data sources
- Data format inconsistencies
- Outdated data references

### Processing Errors
- Memory limitations during processing
- Timeout issues with large datasets
- Configuration mismatches

### Service Dependencies
- Database connectivity
- External API availability
- Resource allocation

## 🛠️ **Diagnostic Steps**

\`\`\`bash
# Check analysis logs
dadm analysis logs --thread-id ${thread.openai_thread}

# Verify data sources
dadm analysis validate --analysis-ids ${thread.analysis_ids.join(',')}

# Check service status
dadm monitor services
\`\`\`

What specific error or issue are you encountering?`;
                }

                // Default response for thread context
                return `# Thread Context: ${thread.name}

I'm analyzing the context for this specific thread. Here's what I can help you with:

## 📋 **Thread Details**
- **Thread ID**: ${thread.openai_thread}
- **Assistant**: ${thread.openai_assistant}
- **Status**: ${thread.status}
- **Analyses**: ${thread.analysis_count}

## 🤔 **How can I assist you?**
- Ask about specific analysis results
- Request troubleshooting help
- Get recommendations for next steps
- Understand the thread's performance

What would you like to know about this analysis thread?`;
            }
        }

        // General AI responses
        if (lowerInput.includes('cli') || lowerInput.includes('command')) {
            return `# CLI Command Assistance 🖥️

## **Common DADM Commands**

### Analysis Management
\`\`\`bash
# Run analysis
dadm analysis run --config analysis_config.yaml

# List analyses
dadm analysis list

# View analysis status
dadm analysis status --id <analysis_id>

# Export results
dadm analysis export --id <analysis_id> --format json
\`\`\`

### Process Management
\`\`\`bash
# Deploy process
dadm deploy --process-file process.bpmn

# Start process
dadm process start --process-id <process_id>

# Monitor processes
dadm monitor processes
\`\`\`

### System Operations
\`\`\`bash
# Check system status
dadm status

# View logs
dadm logs --service all

# Update configuration
dadm config update
\`\`\`

Which specific command would you like help with?`;
        }

        if (lowerInput.includes('analysis') || lowerInput.includes('data')) {
            return `# Data Analysis Guidance 📊

## **Analysis Best Practices**

### 1. **Data Preparation**
- Ensure data quality and completeness
- Validate data sources and formats
- Handle missing values appropriately

### 2. **Analysis Configuration**
- Choose appropriate analysis methods
- Set proper parameters and thresholds
- Configure output formats

### 3. **Result Interpretation**
- Review statistical significance
- Consider business context
- Validate findings with domain experts

## **Common Analysis Types**

| Type | Use Case | Output |
|------|----------|---------|
| Trend Analysis | Identify patterns over time | Time series charts |
| Segmentation | Group similar entities | Cluster assignments |
| Prediction | Forecast future values | Predictive models |
| Classification | Categorize data points | Classification rules |

## **Quality Metrics**
- **Accuracy**: How correct are the results?
- **Completeness**: Is all relevant data included?
- **Timeliness**: Are results generated promptly?
- **Relevance**: Do results address business needs?

What type of analysis are you working on?`;
        }

        // Default response
        return `Thank you for your question! I'm here to help with DADM system analysis and decision management.

## How I can assist you:

🔍 **Analysis Support**: Help interpret results, suggest improvements, troubleshoot issues

🖥️ **CLI Guidance**: Provide command examples, explain parameters, troubleshoot errors  

🧵 **Thread Context**: Discuss specific analysis threads, review outcomes, suggest next steps

📊 **Data Insights**: Explain statistical concepts, suggest visualization approaches

💡 **Best Practices**: Share recommendations for system usage, optimization tips

Please let me know more specifically what you'd like help with, or ask me about:
- Specific analysis results
- CLI commands
- System troubleshooting  
- Data interpretation
- Process optimization

What would you like to explore?`;
    };

    const clearChat = () => {
        setMessages([getWelcomeMessage()]);
        setError(null);
    };

    const exportChat = () => {
        const chatData = {
            mode: chatMode,
            thread_id: selectedThread,
            messages: messages,
            exported_at: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dadm-chat-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <Box className="ai-chat-container" sx={{
            p: 3,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '100%',
            overflow: 'hidden',
            boxSizing: 'border-box',
            '& .MuiGrid-container': {
                maxWidth: '100%'
            },
            '& *': {
                boxSizing: 'border-box'
            }
        }}>
            <style>
                {`
                .ai-chat-container * {
                    word-wrap: break-word !important;
                    overflow-wrap: break-word !important;
                    max-width: 100% !important;
                    hyphens: auto !important;
                }
                .ai-chat-container pre {
                    white-space: pre-wrap !important;
                    word-wrap: break-word !important;
                    overflow-x: auto !important;
                    max-width: 100% !important;
                }
                .ai-chat-container code {
                    word-wrap: break-word !important;
                    overflow-wrap: break-word !important;
                    white-space: pre-wrap !important;
                }
                .ai-chat-container .MuiTypography-root {
                    word-break: break-word !important;
                    overflow-wrap: break-word !important;
                }
                `}
            </style>
            {/* Header */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
                flexShrink: 0,
                minHeight: 48
            }}>
                <Typography variant="h4" component="h1">
                    AI Assistant
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Export Chat">
                        <IconButton onClick={exportChat}>
                            <Download />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Clear Chat">
                        <IconButton onClick={clearChat}>
                            <Clear />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Controls */}
            <Card sx={{
                mb: 2,
                maxWidth: '100%',
                overflow: 'hidden',
                flexShrink: 0,
                minHeight: 'auto'
            }}>
                <CardContent sx={{
                    py: 2,
                    minHeight: 60,
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <Box sx={{
                        display: 'flex',
                        gap: 2,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        minHeight: 40
                    }}>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Chat Mode</InputLabel>
                            <Select
                                value={chatMode}
                                label="Chat Mode"
                                onChange={(e) => setChatMode(e.target.value as any)}
                            >
                                <MenuItem value="standalone">Standalone</MenuItem>
                                <MenuItem value="thread-context">Thread Context</MenuItem>
                            </Select>
                        </FormControl>

                        {chatMode === 'thread-context' && (
                            <>
                                <FormControl size="small" sx={{ minWidth: 400 }}>
                                    <InputLabel>Select Thread</InputLabel>
                                    <Select
                                        value={selectedThread}
                                        label="Select Thread"
                                        onChange={(e) => handleThreadChange(e.target.value)}
                                        disabled={threadsLoading}
                                        sx={{ fontSize: '0.875rem' }}
                                    >
                                        {threadsLoading ? (
                                            <MenuItem value="" disabled>
                                                Loading threads...
                                            </MenuItem>
                                        ) : availableThreads.length === 0 ? (
                                            <MenuItem value="" disabled>
                                                No threads available
                                            </MenuItem>
                                        ) : (
                                            availableThreads.map((thread) => (
                                                <MenuItem key={thread.openai_thread} value={thread.openai_thread}>
                                                    <Typography variant="body2">
                                                        {thread.name} - {thread.openai_thread}
                                                    </Typography>
                                                </MenuItem>
                                            ))
                                        )}
                                    </Select>
                                </FormControl>

                                {selectedThread && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Assistant:
                                        </Typography>
                                        <Typography variant="caption" sx={{
                                            fontFamily: 'monospace',
                                            bgcolor: 'primary.light',
                                            color: 'primary.contrastText',
                                            px: 1,
                                            py: 0.5,
                                            borderRadius: 1
                                        }}>
                                            {availableThreads.find(t => t.openai_thread === selectedThread)?.openai_assistant}
                                        </Typography>

                                        <Tooltip title="Open in OpenAI Playground">
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    const selectedThreadData = availableThreads.find(t => t.openai_thread === selectedThread);
                                                    if (selectedThreadData) {
                                                        const playgroundUrl = `https://platform.openai.com/playground/assistants?assistant=${selectedThreadData.openai_assistant}&thread=${selectedThread}`;
                                                        window.open(playgroundUrl, '_blank');
                                                    }
                                                }}
                                                sx={{ ml: 0.5 }}
                                            >
                                                <OpenInNew fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                )}
                            </>
                        )}

                        <Chip
                            icon={chatMode === 'standalone' ? <Psychology /> : <History />}
                            label={chatMode === 'standalone' ? 'General AI' : `Thread Context (${availableThreads.length} available)`}
                            color="primary"
                            variant="outlined"
                        />

                        {chatMode === 'thread-context' && (
                            <Tooltip title="Refresh threads">
                                <IconButton
                                    onClick={fetchThreads}
                                    disabled={threadsLoading}
                                    size="small"
                                >
                                    <Refresh />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                </CardContent>
            </Card>

            {error && (
                <Alert severity="error" sx={{ mb: 2, flexShrink: 0 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Chat Messages */}
            <Paper sx={{
                flexGrow: 1,
                overflow: 'auto',
                p: 2,
                mb: 2,
                maxWidth: '100%',
                minWidth: 0,
                width: '100%',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                hyphens: 'auto',
                '& *': {
                    maxWidth: '100% !important',
                    wordWrap: 'break-word !important',
                    overflowWrap: 'break-word !important',
                    wordBreak: 'break-word !important'
                },
                '& pre': {
                    whiteSpace: 'pre-wrap !important',
                    wordWrap: 'break-word !important',
                    overflowX: 'auto !important'
                },
                '& code': {
                    whiteSpace: 'pre-wrap !important',
                    wordWrap: 'break-word !important',
                    overflowWrap: 'break-word !important'
                }
            }}>
                <List sx={{
                    maxWidth: '100%',
                    overflow: 'hidden',
                    width: '100%',
                    minWidth: 0
                }}>
                    {messages.map((message) => (
                        <ListItem
                            key={message.id}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
                                mb: 2,
                                maxWidth: '100%',
                                overflow: 'hidden',
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word'
                            }}
                        >
                            <Box
                                sx={{
                                    maxWidth: '85%',
                                    minWidth: 0,
                                    width: 'fit-content',
                                    bgcolor: message.role === 'user' ? 'primary.light' : 'background.paper',
                                    borderRadius: 2,
                                    p: 2,
                                    border: message.role === 'assistant' ? '1px solid' : 'none',
                                    borderColor: message.role === 'assistant' ? 'divider' : 'transparent',
                                    color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                                    boxShadow: message.role === 'assistant' ? 1 : 0,
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word',
                                    '& *': {
                                        maxWidth: '100% !important',
                                        wordWrap: 'break-word !important',
                                        overflowWrap: 'break-word !important',
                                        wordBreak: 'break-word !important'
                                    }
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <Avatar
                                        sx={{
                                            width: 24,
                                            height: 24,
                                            mr: 1,
                                            bgcolor: message.role === 'user' ? 'primary.dark' : 'secondary.main'
                                        }}
                                    >
                                        {message.role === 'user' ? <Person sx={{ fontSize: 16 }} /> : <Psychology sx={{ fontSize: 16 }} />}
                                    </Avatar>
                                    <Typography variant="caption" sx={{ mr: 1, color: 'text.primary', fontWeight: 500 }}>
                                        {message.role === 'user' ? 'You' : 'AI Assistant'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        {new Date(message.timestamp).toLocaleTimeString()}
                                    </Typography>
                                    {message.tokens && (
                                        <Chip
                                            label={`${message.tokens} tokens`}
                                            size="small"
                                            sx={{ ml: 1, height: 20 }}
                                        />
                                    )}
                                </Box>

                                {message.role === 'assistant' ? (
                                    <Box sx={{
                                        color: 'text.primary',
                                        maxWidth: '100%',
                                        minWidth: 0,
                                        overflow: 'hidden',
                                        wordWrap: 'break-word',
                                        overflowWrap: 'break-word',
                                        wordBreak: 'break-word',
                                        '& *': {
                                            maxWidth: '100% !important',
                                            wordWrap: 'break-word !important',
                                            overflowWrap: 'break-word !important'
                                        }
                                    }}>
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                code({ node, inline, className, children, ...props }: any) {
                                                    const match = /language-(\w+)/.exec(className || '');
                                                    return !inline && match ? (
                                                        <SyntaxHighlighter
                                                            style={tomorrow as any}
                                                            language={match[1]}
                                                            PreTag="div"
                                                            wrapLongLines={true}
                                                            customStyle={{
                                                                maxWidth: '100%',
                                                                overflow: 'auto',
                                                                fontSize: '0.875rem',
                                                                wordWrap: 'break-word',
                                                                overflowWrap: 'break-word'
                                                            }}
                                                            {...props}
                                                        >
                                                            {String(children).replace(/\n$/, '')}
                                                        </SyntaxHighlighter>
                                                    ) : (
                                                        <code
                                                            className={className}
                                                            style={{
                                                                backgroundColor: 'rgba(0,0,0,0.1)',
                                                                padding: '2px 4px',
                                                                borderRadius: '3px',
                                                                fontSize: '0.875em',
                                                                wordWrap: 'break-word',
                                                                overflowWrap: 'break-word',
                                                                maxWidth: '100%'
                                                            }}
                                                            {...props}
                                                        >
                                                            {children}
                                                        </code>
                                                    );
                                                },
                                                h1: ({ children }) => (
                                                    <Typography variant="h4" component="h1" sx={{ color: 'text.primary', mb: 2, mt: 2 }}>
                                                        {children}
                                                    </Typography>
                                                ),
                                                h2: ({ children }) => (
                                                    <Typography variant="h5" component="h2" sx={{ color: 'text.primary', mb: 1.5, mt: 1.5 }}>
                                                        {children}
                                                    </Typography>
                                                ),
                                                h3: ({ children }) => (
                                                    <Typography variant="h6" component="h3" sx={{ color: 'text.primary', mb: 1, mt: 1 }}>
                                                        {children}
                                                    </Typography>
                                                ),
                                                p: ({ children }) => (
                                                    <Typography variant="body1" sx={{
                                                        color: 'text.primary',
                                                        mb: 0.5,
                                                        lineHeight: 1.5,
                                                        '&:last-child': { mb: 0 }
                                                    }}>
                                                        {children}
                                                    </Typography>
                                                ),
                                                strong: ({ children }) => (
                                                    <Typography component="strong" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                                                        {children}
                                                    </Typography>
                                                ),
                                                li: ({ children }) => (
                                                    <Typography component="li" sx={{
                                                        color: 'text.primary',
                                                        mb: 0.25,
                                                        lineHeight: 1.4
                                                    }}>
                                                        {children}
                                                    </Typography>
                                                )
                                            }}
                                        >
                                            {message.content}
                                        </ReactMarkdown>
                                    </Box>
                                ) : (
                                    <Typography variant="body1" sx={{
                                        whiteSpace: 'pre-line',
                                        color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                                        lineHeight: 1.5,
                                        wordWrap: 'break-word',
                                        overflowWrap: 'break-word',
                                        wordBreak: 'break-word',
                                        maxWidth: '100%',
                                        minWidth: 0
                                    }}>
                                        {message.content}
                                    </Typography>
                                )}
                            </Box>
                        </ListItem>
                    ))}

                    {loading && (
                        <ListItem sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 24, height: 24, bgcolor: 'secondary.main' }}>
                                    <Psychology sx={{ fontSize: 16 }} />
                                </Avatar>
                                <CircularProgress size={20} />
                                <Typography variant="body2" color="text.secondary">
                                    AI is thinking...
                                </Typography>
                            </Box>
                        </ListItem>
                    )}
                </List>
                <div ref={messagesEndRef} />
            </Paper>

            {/* Input Area */}
            <Box sx={{
                display: 'flex',
                gap: 1,
                maxWidth: '100%',
                overflow: 'hidden',
                minWidth: 0,
                flexShrink: 0,
                minHeight: 56,
                alignItems: 'flex-end'
            }}>
                <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    minRows={1}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about DADM analysis, CLI commands, or system operations..."
                    disabled={loading}
                    sx={{
                        minHeight: 56,
                        '& .MuiOutlinedInput-root': {
                            minHeight: 56
                        }
                    }}
                />
                <Button
                    variant="contained"
                    onClick={handleSendMessage}
                    disabled={loading || !inputMessage.trim()}
                    sx={{
                        minWidth: 'auto',
                        px: 2,
                        minHeight: 56,
                        height: 56
                    }}
                >
                    <Send />
                </Button>
            </Box>
        </Box>
    );
};

export default AIChat;
