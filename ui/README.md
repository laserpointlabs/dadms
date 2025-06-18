# DADM React UI

A comprehensive React-based user interface for the DADM (Decision Analysis & Decision Management) system.

## Features

### 🎛️ **Dashboard Overview**
- System health monitoring
- Recent activity feed
- Quick access to key functions
- Real-time status updates

### 🖥️ **CLI Manager**
- Execute all DADM CLI commands from the UI
- Command history and favorites
- Real-time output streaming
- Command templates and suggestions

### 📊 **Tech Stack Monitor**
- Service status monitoring
- System resource usage
- Process management
- Log viewing and filtering

### 📈 **Analysis Data Viewer**
- Browse and search analysis results
- Export data in multiple formats
- Interactive data visualization
- Filter and sort capabilities

### 🧵 **Thread Context Viewer**
- Review analysis conversation threads
- Examine thread context and metadata
- Navigate through message history
- Thread search and filtering

### 🤖 **AI Assistant Chat**
- Interactive AI assistance
- Context-aware conversations
- Thread-specific discussions
- Markdown rendering with syntax highlighting

## Prerequisites

- Node.js 16+ and npm
- DADM backend services running
- WebSocket server for real-time updates

## Installation

1. **Install dependencies:**
   ```bash
   cd ui
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.development .env.local
   # Edit .env.local with your settings
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Environment Configuration

### Development (.env.development)
```env
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8001
REACT_APP_ENABLE_REAL_TIME=true
REACT_APP_ENABLE_AI_CHAT=true
REACT_APP_LOG_LEVEL=debug
```

### Production (.env.production)
```env
REACT_APP_API_BASE_URL=https://your-dadm-api.com
REACT_APP_WS_URL=wss://your-dadm-api.com
REACT_APP_LOG_LEVEL=error
REACT_APP_AUTH_ENABLED=true
```

## Project Structure

```
ui/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── AIChat.tsx
│   │   ├── AnalysisDataViewer.tsx
│   │   ├── CLIManager.tsx
│   │   ├── DashboardOverview.tsx
│   │   ├── TechStackMonitor.tsx
│   │   └── ThreadContextViewer.tsx
│   ├── services/           # API and WebSocket services
│   │   ├── api.ts
│   │   └── websocket.ts
│   ├── utils/              # Helper functions
│   │   └── helpers.ts
│   ├── App.tsx             # Main app component
│   └── index.tsx           # Entry point
├── package.json
└── README.md
```

## Components Overview

### **Dashboard Overview**
Central hub showing:
- System status summary
- Recent analysis activities  
- Quick action buttons
- System health metrics

### **CLI Manager**
Full CLI integration:
- Execute commands with real-time output
- Command history and bookmarks
- Auto-completion and suggestions
- Output filtering and search

### **Tech Stack Monitor**
System monitoring:
- Service health status
- Resource utilization charts
- Process management
- Live log streaming

### **Analysis Data Viewer**
Data management:
- Browse analysis results
- Advanced filtering and search
- Export capabilities
- Data visualization

### **Thread Context Viewer**
Conversation analysis:
- Thread browsing and search
- Message history navigation
- Context data inspection
- Metadata analysis

### **AI Assistant**
Intelligent help:
- Natural language queries
- Context-aware responses
- Thread-specific discussions
- Command assistance

## API Integration

The UI connects to DADM backend services through:

### **REST API** (`/api/`)
- Analysis management
- System monitoring
- CLI command execution
- Thread operations

### **WebSocket** (`/ws/`)
- Real-time updates
- Live command output
- System status changes
- AI chat streaming

## Development

### **Available Scripts**

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### **Technology Stack**

- **React 18** - Core framework
- **TypeScript** - Type safety
- **Material-UI** - Component library
- **React Router** - Navigation
- **Axios** - HTTP client
- **Socket.IO** - WebSocket client
- **React Markdown** - Markdown rendering
- **Recharts** - Data visualization

### **Code Style**

- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Component-based architecture

## Deployment

### **Development Deployment**
```bash
npm start
# Access at http://localhost:3000
```

### **Production Build**
```bash
npm run build
# Serve the build/ directory
```

### **Docker Deployment**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY build/ ./build/
EXPOSE 3000
CMD ["npx", "serve", "-s", "build", "-l", "3000"]
```

## Configuration

### **Feature Flags**
Control UI features via environment variables:
- `REACT_APP_ENABLE_REAL_TIME` - Real-time updates
- `REACT_APP_ENABLE_AI_CHAT` - AI assistant
- `REACT_APP_ENABLE_THREAD_CONTEXT` - Thread viewer
- `REACT_APP_ENABLE_CLI_MANAGER` - CLI interface

### **API Endpoints**
Configure backend connections:
- `REACT_APP_API_BASE_URL` - REST API base URL
- `REACT_APP_WS_URL` - WebSocket server URL

## Troubleshooting

### **Common Issues**

1. **Build Errors**
   - Ensure Node.js 16+ is installed
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall

2. **API Connection**
   - Verify backend services are running
   - Check CORS configuration
   - Validate environment variables

3. **WebSocket Issues**
   - Confirm WebSocket server is accessible
   - Check firewall settings
   - Verify URL protocol (ws/wss)

### **Logs and Debugging**

- Browser developer tools console
- Network tab for API calls
- WebSocket connection status
- Component state in React DevTools

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review backend service logs
3. Verify environment configuration
4. Check browser console for errors

## License

Part of the DADM project - see main project LICENSE file.
