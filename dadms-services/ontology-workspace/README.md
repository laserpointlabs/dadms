# DADMS Ontology Workspace Service

A comprehensive visual ontology editing environment with draw.io and cemento integration, built as part of the DADMS 2.0 platform.

## 🎯 Overview

The Ontology Workspace Service provides a collaborative environment for authoring, editing, and validating ontologies with powerful visual editing capabilities. It seamlessly integrates with draw.io for visual ontology design and cemento for bi-directional conversion between diagram and ontology formats.

## ✨ Key Features

### 🎨 Visual Ontology Editing
- **Interactive visual editing** with drag-and-drop interface
- **Multi-format support**: OWL/XML, Turtle, RDF/XML, JSON-LD, N-Triples, ROBOT
- **Auto-layout algorithms**: Hierarchical, force-directed, circular, grid layouts
- **Visual styling**: Customizable colors, shapes, and connections

### 🖼️ draw.io Integration
- **Import from draw.io**: Convert diagram files to ontologies using cemento
- **Export to draw.io**: Generate visual diagrams from ontology definitions
- **Flexible interpretation**: Strict OWL, flexible mapping, custom rules
- **Layout preservation**: Maintain visual arrangements across conversions

### 🔧 Cemento Integration
- **Bi-directional conversion**: draw.io ↔ Turtle/OWL formats
- **Term matching**: Reference ontology integration with CCO, OWL, RDFS
- **Validation**: Built-in ontology validation using cemento
- **Metadata extraction**: Automatic class, property, and individual counting

### ✅ Ontology Validation
- **Multiple reasoners**: HermiT, Pellet, ELK support
- **Profile compliance**: OWL Full, OWL DL, OWL EL, OWL QL, OWL RL
- **Quality metrics**: Depth, breadth, tangledness analysis
- **Error reporting**: Detailed validation errors and warnings

### 💬 Collaboration Features
- **Real-time editing**: Multiple users can edit simultaneously
- **Comments & discussions**: Contextual feedback on ontology elements
- **Change tracking**: Complete audit trail of modifications
- **User sessions**: Active user tracking with cursor positions

## 🏗️ Architecture

```
dadms-services/ontology-workspace/
├── src/
│   ├── controllers/           # API request handlers
│   │   ├── workspaceController.ts    # Workspace CRUD operations
│   │   └── integrationController.ts # draw.io & cemento integration
│   ├── services/              # Business logic layer
│   │   └── workspaceService.ts       # Core workspace operations
│   ├── integrations/          # External tool integrations
│   │   └── cementoService.ts         # Cemento wrapper service
│   ├── models/                # TypeScript interfaces
│   │   └── workspace.ts              # Data models & types
│   ├── database/              # Database layer
│   │   ├── connection.ts             # PostgreSQL connection
│   │   └── schema.sql               # Database schema
│   ├── routes/                # Express routes
│   │   └── index.ts                 # Route definitions
│   └── index.ts               # Service entry point
├── package.json               # Dependencies & scripts
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Python 3.10+ (for cemento)
- [Cemento package](https://pypi.org/project/cemento/) installed

### Installation

1. **Install cemento**:
   ```bash
   pip install cemento
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your database configuration
   ```

4. **Initialize database**:
   ```bash
   psql -d dadms -f src/database/schema.sql
   ```

5. **Start the service**:
   ```bash
   npm run dev
   ```

The service will be available at `http://localhost:3016`

## 📡 API Endpoints

### Workspace Management
- `GET /workspaces` - List workspaces
- `POST /workspaces` - Create workspace
- `GET /workspaces/{id}` - Get workspace details
- `PUT /workspaces/{id}` - Update workspace
- `DELETE /workspaces/{id}` - Delete workspace

### Ontology Management
- `GET /workspaces/{id}/ontologies` - List ontologies
- `POST /workspaces/{id}/ontologies` - Add ontology
- `GET /workspaces/{id}/ontologies/{id}` - Get ontology
- `PUT /workspaces/{id}/ontologies/{id}` - Update ontology
- `DELETE /workspaces/{id}/ontologies/{id}` - Delete ontology

### draw.io Integration
- `POST /workspaces/{id}/integrations/drawio` - Import from draw.io
- `GET /workspaces/{id}/ontologies/{id}/export/drawio` - Export to draw.io

### Cemento Integration
- `POST /workspaces/{id}/integrations/cemento` - Sync with cemento
- `GET /integrations/cemento/status` - Check cemento availability

### Validation
- `POST /workspaces/{id}/ontologies/{id}/validate` - Validate ontology

### Health & Monitoring
- `GET /health` - Service health check
- `GET /api` - API information

## 🎯 Usage Examples

### Import draw.io Diagram

```bash
curl -X POST "http://localhost:3016/workspaces/{workspace-id}/integrations/drawio" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@my-ontology.drawio" \
  -F 'options={"interpretation_mode":"flexible_mapping","generate_iris":true}'
```

### Export Ontology to draw.io

```bash
curl -X GET "http://localhost:3016/workspaces/{workspace-id}/ontologies/{ontology-id}/export/drawio" \
  -H "Accept: application/xml" \
  --output ontology-diagram.drawio
```

### Validate Ontology

```bash
curl -X POST "http://localhost:3016/workspaces/{workspace-id}/ontologies/{ontology-id}/validate" \
  -H "Content-Type: application/json" \
  -d '{"reasoner":"hermit","include_quality_metrics":true}'
```

### Check Cemento Status

```bash
curl -X GET "http://localhost:3016/integrations/cemento/status"
```

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3016
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Database Configuration  
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dadms
DB_USER=dadms_user
DB_PASSWORD=dadms_password

# Cemento Configuration
CEMENTO_TIMEOUT=30000
CEMENTO_TEMP_DIR=./temp/cemento
```

### Workspace Settings

```json
{
  "auto_save_enabled": true,
  "auto_layout_enabled": false,
  "validation_on_save": true,
  "default_reasoner": "hermit",
  "color_scheme": "auto",
  "grid_enabled": true,
  "snap_to_grid": false
}
```

## 🎨 Visual Layout System

The service supports multiple layout algorithms for automatic ontology visualization:

- **Hierarchical**: Tree-based layout following class hierarchies
- **Force-directed**: Physics-based node positioning
- **Circular**: Circular arrangement of elements
- **Grid**: Organized grid layout
- **Manual**: User-defined positioning

Visual elements can be customized with:
- Fill and border colors
- Shape types (rectangle, ellipse, diamond, hexagon)
- Font families and sizes
- Connection styles and arrow types

## 🔄 Cemento Integration Details

The service leverages the [cemento package](https://pypi.org/project/cemento/) for powerful ontology conversion capabilities:

### Supported Conversions
- **draw.io → Turtle**: `cemento drawio_ttl input.drawio output.ttl`
- **Turtle → draw.io**: `cemento ttl_drawio input.ttl output.drawio`

### Features
- **Term matching** with reference ontologies (CCO, OWL, RDFS)
- **Custom prefix support** for namespace management
- **Layout generation** for visual diagram creation
- **Validation** through conversion round-trips

### Reference Ontologies
Cemento comes bundled with:
- Common Core Ontologies (CCO)
- OWL Schema
- RDF Schema
- RDFS Schema

## 🗄️ Database Schema

The service uses PostgreSQL with the following main tables:

- `ontology_workspaces` - Workspace metadata and settings
- `ontology_documents` - Ontology content and visual layouts
- `ontology_comments` - Collaboration comments
- `ontology_discussions` - Discussion threads
- `ontology_validations` - Validation history
- `ontology_changes` - Change tracking
- `active_sessions` - Real-time collaboration

## 🚦 Health Monitoring

The service provides comprehensive health monitoring:

```bash
GET /health
```

Response includes:
- Overall service status
- Database connectivity
- Response times
- Error states

## 🧪 Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
npm run lint:fix
```

## 🤝 Integration with DADMS Platform

This service is part of the larger DADMS 2.0 ecosystem:

- **Port**: 3016 (as defined in DADMS architecture)
- **Database**: Shared PostgreSQL instance
- **Authentication**: JWT tokens from DADMS auth service
- **Events**: Integration with EventManager service (port 3004)

## 📚 Related Services

- **Project Service** (3001): Project lifecycle management
- **Knowledge Service** (3003): Document storage and RAG
- **LLM Service** (3002): AI assistance for ontology development
- **Context Manager** (3020): AI context and persona management

## 🔮 Future Enhancements

- **WebSocket support** for real-time collaboration
- **Advanced reasoner integration** (HermiT, Pellet, ELK)
- **SPARQL query interface** for ontology exploration
- **Version control** with Git-like branching
- **Template library** for common ontology patterns
- **Export to multiple formats** (GraphML, GEPHI, etc.)

## 📄 License

This project is part of DADMS 2.0 and follows the same licensing terms.

## 🆘 Support

For issues and questions:
1. Check the health endpoint: `/health`
2. Review logs for error details
3. Verify cemento installation: `cemento --version`
4. Ensure database connectivity

---

Built with ❤️ as part of DADMS 2.0 - Decision Analysis and Decision Management System 