# Agent Assistant & Documentation Service (AADS)

## Overview

The Agent Assistant & Documentation Service (AADS) is a core component of DADMS 2.0 that provides intelligent assistance and documentation capabilities for decision finalization. It serves as the final step in the decision process, helping users summarize their work, get AI assistance, and prepare decisions for review and approval.

## Features

### 1. Decision Review
- **Project Overview**: Display project details, decision context, and process information
- **Participant Management**: Track all stakeholders involved in the decision
- **Key Findings**: Summarize the main insights from the analysis
- **Risk Assessment**: Document identified risks and mitigation strategies
- **Recommendations**: Present final recommendations with rationale

### 2. AI Assistant & Team Collaboration
- **Real-time Chat**: Interactive chat interface with AI assistant
- **Team Collaboration**: Support for team member comments and feedback
- **Context Awareness**: AI assistant understands the decision context
- **Proactive Suggestions**: AI provides recommendations and identifies potential issues

### 3. White Paper Editor
- **Structured Sections**: Pre-defined sections for comprehensive documentation
- **AI Generation**: Generate content using AI based on decision analysis
- **Rich Text Editing**: Full-featured text editor for document creation
- **Version Control**: Track changes and maintain document history
- **Export Capabilities**: Export to PDF and other formats

### 4. Approval Workflow
- **BPMN Integration**: Submit decisions to BPMN approval workflows
- **Status Tracking**: Monitor approval status and progress
- **Audit Trail**: Complete history of approval actions and comments
- **Compliance**: Ensure decisions meet governance requirements

## API Endpoints

### Decision Management
- `GET /api/decisions/:projectId/summary` - Get decision summary
- `PUT /api/decisions/:projectId/summary` - Update decision summary

### Chat & Collaboration
- `GET /api/decisions/:projectId/chat` - Get chat messages
- `POST /api/decisions/:projectId/chat` - Send chat message

### White Paper Management
- `GET /api/decisions/:projectId/white-paper` - Get white paper
- `PUT /api/decisions/:projectId/white-paper/sections/:sectionId` - Update section
- `POST /api/decisions/:projectId/white-paper/generate` - Generate with AI
- `PUT /api/decisions/:projectId/white-paper/draft` - Save draft
- `POST /api/decisions/:projectId/white-paper/export/pdf` - Export PDF

### Approval Management
- `POST /api/decisions/:projectId/approval` - Submit for approval
- `GET /api/decisions/:projectId/approval/status` - Get approval status

## Architecture

```
AADS Service (Port 3005)
├── Decision Controller
│   ├── Decision Summary Management
│   └── Status Updates
├── Chat Controller
│   ├── Message Handling
│   └── AI Integration
├── White Paper Controller
│   ├── Document Management
│   ├── AI Generation
│   └── Export Services
└── Approval Controller
    ├── Workflow Integration
    └── Status Tracking
```

## Integration Points

### Frontend Integration
- **React UI**: Modern, responsive interface with Material-UI components
- **Real-time Updates**: WebSocket support for live collaboration
- **State Management**: Centralized state for decision data

### Backend Integration
- **Event Bus**: Publishes decision events for system-wide awareness
- **LLM Service**: Integrates with AI providers for content generation
- **BPMN Engine**: Submits decisions to approval workflows
- **Knowledge Service**: Accesses project context and historical data

### External Services
- **PDF Generation**: Puppeteer-based PDF export
- **AI Providers**: OpenAI, Claude, and other LLM integrations
- **Document Storage**: MinIO integration for artifact management

## Development

### Prerequisites
- Node.js 18+
- TypeScript 5+
- PostgreSQL (for production)

### Setup
```bash
cd dadms-services/aads
npm install
npm run dev
```

### Environment Variables
```env
PORT=3005
DATABASE_URL=postgresql://user:password@localhost:5432/dadms_aads
LLM_SERVICE_URL=http://localhost:3002
EVENT_BUS_URL=http://localhost:3004
BPMN_SERVICE_URL=http://localhost:8080
```

### Testing
```bash
npm test
npm run lint
```

## Usage Workflow

1. **Decision Completion**: User completes decision analysis in other DADMS services
2. **AADS Access**: User navigates to AADS page for decision finalization
3. **Review Process**: User reviews decision summary and key findings
4. **AI Assistance**: User interacts with AI assistant for guidance and suggestions
5. **Document Creation**: User creates or generates white paper with AI assistance
6. **Team Collaboration**: Team members provide feedback and comments
7. **Approval Submission**: User submits decision for formal approval
8. **Status Tracking**: User monitors approval progress and receives notifications

## Future Enhancements

- **Advanced AI Features**: More sophisticated AI assistance and content generation
- **Collaborative Editing**: Real-time collaborative document editing
- **Advanced Workflows**: Complex approval workflows with multiple stakeholders
- **Integration APIs**: RESTful APIs for external system integration
- **Analytics**: Decision analytics and performance metrics
- **Mobile Support**: Mobile-responsive interface for field use

## Contributing

This service follows the DADMS 2.0 development guidelines:
- Clean architecture principles
- TypeScript for type safety
- Comprehensive testing
- API-first design
- Documentation-driven development

## License

MIT License - see LICENSE file for details. 