import {
    Clear,
    Download,
    History,
    Person,
    Psychology,
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
    thread_id: string;
    name: string;
    analysis_id: string;
    status: string;
    message_count: number;
}

const AIChat: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedThread, setSelectedThread] = useState<string>('');
    const [availableThreads, setAvailableThreads] = useState<ThreadContext[]>([]);
    const [chatMode, setChatMode] = useState<'standalone' | 'thread-context'>('standalone');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const mockThreads: ThreadContext[] = [
        {
            thread_id: 'thread_001',
            name: 'Market Analysis Q4 2024',
            analysis_id: 'analysis_001',
            status: 'completed',
            message_count: 24
        },
        {
            thread_id: 'thread_002',
            name: 'Customer Segmentation Analysis',
            analysis_id: 'analysis_002',
            status: 'active',
            message_count: 15
        },
        {
            thread_id: 'thread_003',
            name: 'Risk Assessment Pipeline',
            analysis_id: 'analysis_003',
            status: 'pending',
            message_count: 3
        }
    ];

    const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `# Welcome to DADM AI Assistant! 🤖

I'm here to help you with:

## 🔍 **Analysis & Decision Support**
- Interpret analysis results
- Provide insights and recommendations
- Help understand complex data patterns

## 🧵 **Thread Context Integration**
- Discuss specific analysis threads
- Review conversation history
- Analyze thread outcomes

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
- **Thread Context**: Focus on specific analysis threads

What would you like to explore today?`,
        timestamp: new Date().toISOString()
    };

    useEffect(() => {
        setAvailableThreads(mockThreads);
        setMessages([welcomeMessage]);
    }, []); // Empty dependency array is intentional for initialization

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
            // Simulate AI response
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
        } catch (err) {
            setError('Failed to get AI response');
        } finally {
            setLoading(false);
        }
    };

    const generateAIResponse = (input: string, mode: string, threadId: string): string => {
        const lowerInput = input.toLowerCase();

        if (mode === 'thread-context' && threadId) {
            const thread = availableThreads.find(t => t.thread_id === threadId);
            if (thread) {
                if (lowerInput.includes('summary') || lowerInput.includes('overview')) {
                    return `# Thread Summary: ${thread.name}

## 📊 **Analysis Overview**
- **Thread ID**: ${thread.thread_id}
- **Analysis ID**: ${thread.analysis_id}
- **Status**: ${thread.status}
- **Messages**: ${thread.message_count}

## 🔍 **Key Insights**
Based on the thread context, this analysis focused on ${thread.name.toLowerCase()}. The current status is **${thread.status}** with ${thread.message_count} messages exchanged.

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
dadm analysis logs --thread-id ${thread.thread_id}

# Verify data sources
dadm analysis validate --analysis-id ${thread.analysis_id}

# Check service status
dadm monitor services
\`\`\`

What specific error or issue are you encountering?`;
                }
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
        setMessages([welcomeMessage]);
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
        <Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
            <Card sx={{ mb: 2 }}>
                <CardContent sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
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
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Select Thread</InputLabel>
                                <Select
                                    value={selectedThread}
                                    label="Select Thread"
                                    onChange={(e) => setSelectedThread(e.target.value)}
                                >
                                    {availableThreads.map((thread) => (
                                        <MenuItem key={thread.thread_id} value={thread.thread_id}>
                                            {thread.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        <Chip
                            icon={chatMode === 'standalone' ? <Psychology /> : <History />}
                            label={chatMode === 'standalone' ? 'General AI' : 'Thread Context'}
                            color="primary"
                            variant="outlined"
                        />
                    </Box>
                </CardContent>
            </Card>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Chat Messages */}
            <Paper sx={{ flexGrow: 1, overflow: 'auto', p: 2, mb: 2 }}>
                <List>
                    {messages.map((message) => (
                        <ListItem
                            key={message.id}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
                                mb: 2
                            }}
                        >
                            <Box
                                sx={{
                                    maxWidth: '85%',
                                    bgcolor: message.role === 'user' ? 'primary.light' : 'background.paper',
                                    borderRadius: 2,
                                    p: 2,
                                    border: message.role === 'assistant' ? '1px solid' : 'none',
                                    borderColor: message.role === 'assistant' ? 'divider' : 'transparent',
                                    color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                                    boxShadow: message.role === 'assistant' ? 1 : 0
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
                                    <Box sx={{ color: 'text.primary' }}>
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
                                                                fontSize: '0.875em'
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
                                                    <Typography variant="body1" sx={{ color: 'text.primary', mb: 1, lineHeight: 1.6 }}>
                                                        {children}
                                                    </Typography>
                                                ),
                                                strong: ({ children }) => (
                                                    <Typography component="strong" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                                                        {children}
                                                    </Typography>
                                                ),
                                                li: ({ children }) => (
                                                    <Typography component="li" sx={{ color: 'text.primary', mb: 0.5 }}>
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
                                        whiteSpace: 'pre-wrap',
                                        color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                                        lineHeight: 1.6
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
            <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about DADM analysis, CLI commands, or system operations..."
                    disabled={loading}
                />
                <Button
                    variant="contained"
                    onClick={handleSendMessage}
                    disabled={loading || !inputMessage.trim()}
                    sx={{ minWidth: 'auto', px: 2 }}
                >
                    <Send />
                </Button>
            </Box>
        </Box>
    );
};

export default AIChat;
