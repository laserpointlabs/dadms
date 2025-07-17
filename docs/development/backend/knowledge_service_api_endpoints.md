# Knowledge Service – API Endpoint Specification

This document details the API endpoints for the Knowledge Service in DADMS 2.0, including endpoint paths, HTTP methods, descriptions, and example request/response schemas for documents and tags.

---

## Endpoints Summary

### Documents
| Method | Path                        | Description                        | Request Body / Params         | Response Body                | Auth? |
|--------|-----------------------------|------------------------------------|-------------------------------|------------------------------|-------|
| GET    | `/documents`                | Search/list documents              | Query: query, tags, pagination| Array of Document            | Yes   |
| POST   | `/documents`                | Upload a new document              | DocumentUpload (multipart)    | Document                     | Yes   |
| GET    | `/documents/{id}`           | Get document metadata by ID        | Path: id                      | Document                     | Yes   |
| DELETE | `/documents/{id}`           | Delete document by ID              | Path: id                      | Success/Error                | Yes   |
| GET    | `/documents/{id}/download`  | Download document file             | Path: id                      | File (binary)                | Yes   |

### Tags
| Method | Path              | Description                | Request Body / Params         | Response Body                | Auth? |
|--------|-------------------|----------------------------|-------------------------------|------------------------------|-------|
| GET    | `/tags`           | List all tags              | None                          | Array of Tag                 | Yes   |
| POST   | `/tags`           | Create a new tag           | TagCreate (JSON)              | Tag                          | Yes   |
| GET    | `/tags/{id}`      | Get tag by ID              | Path: id                      | Tag                          | Yes   |
| PUT    | `/tags/{id}`      | Update tag by ID           | TagUpdate (JSON)              | Tag                          | Yes   |
| DELETE | `/tags/{id}`      | Delete tag by ID           | Path: id                      | Success/Error                | Yes   |

---

## Example Schemas

### Document (Response)
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "tags": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "color": "string"
    }
  ],
  "url": "string",
  "created_at": "ISO8601 timestamp",
  "updated_at": "ISO8601 timestamp",
  "size": 12345,
  "content_type": "application/pdf"
}
```

### DocumentUpload (Request, multipart/form-data)
- `name`: string
- `description`: string
- `tags`: array of string (tag IDs)
- `file`: binary

### Tag (Response)
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "color": "string"
}
```

### TagCreate (Request)
```json
{
  "name": "string",
  "description": "string",
  "color": "string"
}
```

### TagUpdate (Request)
```json
{
  "name": "string",
  "description": "string",
  "color": "string"
}
```

---

## Notes
- **Authentication:** All endpoints require authentication (e.g., JWT or session-based; to be specified in implementation).
- **Pagination/Filtering:** List/search endpoints support pagination and filtering via query parameters.
- **Error Handling:** Error responses follow a standard error schema, e.g.:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "string (optional)"
  }
}
```

- **Timestamps:** All timestamps are in ISO8601 format.
- **File Upload/Download:** Document upload uses `multipart/form-data`; download returns binary file content.

---

## Document Chunking & Vectorization Workflow

The Knowledge Service is responsible for chunking documents and pushing their embeddings to the vector store (Qdrant) as part of the document ingestion pipeline. This is implemented as a method within the Knowledge Service, not as a separate microservice.

### When is Chunking & Vectorization Triggered?
- **On Document Upload:**
  - Every time a new document is uploaded, the service automatically extracts text, chunks it, generates embeddings, and pushes the chunks to the vector store.
- **On Demand (Reprocess):**
  - Optionally, a `POST /documents/{id}/reprocess` endpoint can be provided to manually re-chunk and re-embed a document (e.g., after changing chunking parameters or embedding model).

### Chunking & Embedding Parameters
- **Chunk Size:** 500–1000 tokens (or ~200–500 words), sentence-aware splitting.
- **Chunk Overlap:** 10–20% (e.g., 50–100 tokens) to preserve context at chunk boundaries.
- **Embedding Model:** Configurable; use a high-quality model (OpenAI, Cohere, or local/Ollama).

### Metadata Stored with Each Chunk
- `document_id`: Reference to the parent document
- `chunk_id`: Unique within the document
- `chunk_index`: Order in the document
- `text`: The chunk content
- `tags`: Inherited from the document
- `source`: Filename, page number, etc. (if available)
- `created_at`, `updated_at`: Timestamps

#### Example Chunk Metadata
```json
{
  "document_id": "doc_123",
  "chunk_id": "doc_123_chunk_5",
  "chunk_index": 5,
  "text": "This is the content of the chunk...",
  "tags": ["policy", "safety"],
  "source": "manual.pdf",
  "page": 12,
  "created_at": "2024-06-01T12:00:00Z"
}
```

### Vector Store Integration
- Each chunk is embedded and upserted to Qdrant as a separate vector, with all metadata attached.
- The vector store is queried for semantic search and RAG workflows.

### API/Workflow Summary
- **Upload:** Chunking and vectorization are automatic.
- **Reprocess:** Optionally, expose an endpoint to re-chunk/re-embed a document.
- **Search:** Queries are embedded and matched against chunk vectors in Qdrant.

---

**This workflow ensures robust, efficient, and context-preserving document retrieval for RAG and semantic search in DADMS.**

**This document serves as the reference for Knowledge Service API design and implementation.** 

### Embedding Model & Method

- **Default Embedding Model:**
  - `text-embedding-ada-002` (OpenAI) or an open-source model such as `BAAI/bge-base-en-v1.5` (via Ollama or HuggingFace)
  - Configurable via environment variable `EMBEDDING_MODEL` or service config.
- **Preprocessing:**
  - Text is stripped of leading/trailing whitespace.
  - No lowercasing or language detection by default.
- **Embedding Generation:**
  - Each chunk is embedded individually during upload (or reprocess).
  - Embeddings are generated synchronously as part of the ingestion pipeline.
- **Metadata:**
  - The embedding model name and version are stored with each chunk in the vector store for auditability.
- **Extensibility:**
  - The system is designed to support additional embedding providers (e.g., Cohere, Ollama/local, HuggingFace) via a pluggable interface.

#### Example Chunk Metadata (with open-source embedding model)
```json
{
  "document_id": "doc_123",
  "chunk_id": "doc_123_chunk_5",
  "chunk_index": 5,
  "text": "This is the content of the chunk...",
  "embedding_model": "BAAI/bge-base-en-v1.5",
  "tags": ["policy", "safety"],
  "source": "manual.pdf",
  "page": 12,
  "created_at": "2024-06-01T12:00:00Z"
}
``` 

---

## Knowledge Graph Integration

The Knowledge Service will actively integrate with a Knowledge Graph to enhance document understanding, discovery, and advanced analytics. This integration supports entity and relationship extraction, graph storage, semantic search, and linking structured knowledge to documents and chunks.

### Purpose
- Capture entities, relationships, and concepts from documents to enable:
  - Advanced navigation and discovery
  - Impact and dependency analysis
  - Semantic enrichment of search and RAG workflows
  - Cross-document and cross-domain knowledge linking

### Core API Concepts
- **Entity Extraction:** Identify and extract entities (people, organizations, concepts, etc.) from documents and chunks.
- **Relationship Extraction:** Detect and store relationships between entities (e.g., "Person A works for Organization B").
- **Graph Storage:** Store entities and relationships in a graph database (e.g., Neo4j).
- **Linking:** Associate graph nodes/edges with source documents and chunks for traceability.
- **Graph Search:** Enable semantic and structural queries over the knowledge graph (e.g., "find all documents related to Project X").

### Example Endpoints (to be defined)
| Method | Path                        | Description                                 |
|--------|-----------------------------|---------------------------------------------|
| POST   | `/graph/entities`           | Extract and store entities from a document  |
| POST   | `/graph/relationships`      | Extract and store relationships             |
| GET    | `/graph/entities/{id}`      | Get entity details and linked documents     |
| GET    | `/graph/search`             | Query the knowledge graph                   |
| GET    | `/documents/{id}/graph`     | Get graph view for a document               |

### Use Cases
- **Semantic Search:** Find documents by entity or relationship, not just keywords.
- **Impact Analysis:** Trace dependencies and related knowledge across projects/domains.
- **Context Injection:** Enrich LLM prompts with relevant entities/relationships.
- **Visualization:** Display knowledge graphs for user exploration and audit.

### Implementation Notes
- Entity and relationship extraction may use LLMs, NLP models, or rule-based methods.
- Graph database (e.g., Neo4j) will be integrated as a core backend component.
- All graph nodes/edges will include provenance metadata linking back to source documents/chunks.

---

## Planned: Search Engine Service (SES) Integration

The Knowledge Service is designed for future integration with a Search Engine Service (SES) to enable federated or external search capabilities. This service may:

- Search the public web, enterprise tools (e.g., SharePoint, Confluence), or other knowledge bases.
- Be called directly by the Knowledge Service for hybrid search results, or as a context enhancer for LLM workflows.
- Return results that can be injected into LLM prompts, RAG pipelines, or user-facing search interfaces.

**Planned API/Integration Points:**
- `POST /search-engine/query` (future): Accepts a query and returns results from configured sources.
- Configurable sources: Web, SharePoint, Confluence, etc.
- Results may be combined with vector search for hybrid retrieval.

**Note:**
This is a planned extension for future releases and is not part of the current MVP. 

---

## Appendix: Future State Options & Inventive Methods

The following are potential future enhancements and inventive methods for the Knowledge Service, inspired by current best practices and emerging trends. These are not part of the MVP but may be considered as the system evolves:

- **Advanced Hybrid Search:**
  - Combine vector search, keyword (BM25/Elastic) search, and graph-based search for more accurate and context-aware retrieval.

- **Semantic Enrichment:**
  - Automatically extract entities, topics, and relationships from documents to enhance metadata and search relevance.

- **Automated Document Summarization:**
  - Use LLMs or dedicated models to generate concise summaries for each document or chunk, improving search previews and context injection.

- **Knowledge Graph Integration:**
  - Link extracted entities and relationships into a knowledge graph (e.g., Neo4j) for advanced navigation, discovery, and impact analysis.

- **Real-Time Document Ingestion:**
  - Support streaming or webhook-based ingestion for near real-time updates from external sources (e.g., email, chat, cloud storage).

- **Feedback-Driven Re-Ranking:**
  - Incorporate user feedback (explicit or implicit) to re-rank search results and improve retrieval quality over time.

- **Multi-Modal Search:**
  - Support searching and embedding not just text, but also images, audio, and other file types using multi-modal models.

- **User Personalization:**
  - Tailor search results and recommendations based on user roles, history, or preferences.

- **Federated Search:**
  - Seamlessly query multiple internal and external knowledge sources (databases, APIs, SaaS tools) in a single search.

- **Automated Document Classification & Tagging:**
  - Use ML/AI to auto-classify and tag documents on upload, reducing manual effort and improving organization.

- **AI-Powered Knowledge Extraction:**
  - Extract structured data, facts, or decision-relevant information from unstructured documents for downstream analytics and automation.

- **Explainable Search & Retrieval:**
  - Provide transparency on why certain results were retrieved (e.g., similarity score, keyword match, graph path).

- **Provenance & Audit Trails:**
  - Track the origin, version, and transformation history of all knowledge artifacts for compliance and governance.

- **Collaborative Annotation & Review:**
  - Enable users to annotate, comment, and review documents or search results collaboratively.

---

**These options provide a roadmap for continuous improvement and innovation in the DADMS Knowledge Service.** 