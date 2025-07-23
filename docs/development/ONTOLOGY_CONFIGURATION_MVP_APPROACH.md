# DADMS 2.0 MVP: Ontology Configuration Approach

## Recommendation: Hybrid Database + JSON Configuration

Based on your clean architecture and existing service specifications, here's the recommended approach for managing entity, object, and data properties in the MVP:

## 1. Database-Driven Core with JSON Bootstrapping

### Primary Approach: Database Tables
```sql
-- Core ontology management tables
CREATE TABLE ontology_schemas (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    domain VARCHAR(100) NOT NULL,
    scope VARCHAR(20) CHECK (scope IN ('general', 'domain', 'project')),
    status VARCHAR(20) DEFAULT 'active',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE entity_definitions (
    id UUID PRIMARY KEY,
    ontology_id UUID REFERENCES ontology_schemas(id),
    name VARCHAR(255) NOT NULL,
    label VARCHAR(255),
    description TEXT,
    entity_type VARCHAR(50) NOT NULL, -- 'concept', 'individual', 'property'
    properties JSONB, -- Flexible property storage
    constraints JSONB, -- Validation rules
    confidence DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE property_definitions (
    id UUID PRIMARY KEY,
    entity_id UUID REFERENCES entity_definitions(id),
    property_name VARCHAR(255) NOT NULL,
    property_type VARCHAR(50) NOT NULL, -- 'data_property', 'object_property'
    data_type VARCHAR(100), -- For data properties
    target_entity_id UUID REFERENCES entity_definitions(id), -- For object properties
    cardinality JSONB, -- min, max, exact cardinality
    validation_rules JSONB,
    required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE relationship_definitions (
    id UUID PRIMARY KEY,
    ontology_id UUID REFERENCES ontology_schemas(id),
    name VARCHAR(255) NOT NULL,
    source_entity_id UUID REFERENCES entity_definitions(id),
    target_entity_id UUID REFERENCES entity_definitions(id),
    relationship_type VARCHAR(50), -- 'hasA', 'isA', 'partOf', 'relatedTo'
    properties JSONB,
    confidence DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### JSON Configuration for Bootstrapping
```json
{
  "ontology_templates": {
    "defense_decision_making": {
      "version": "2.1.0",
      "domain": "Defense",
      "entities": [
        {
          "name": "Mission",
          "type": "concept",
          "properties": [
            {
              "name": "priority",
              "type": "data_property",
              "data_type": "string",
              "constraints": {
                "enum": ["critical", "high", "medium", "low"]
              }
            },
            {
              "name": "has_threat_assessment",
              "type": "object_property",
              "target_entity": "ThreatAssessment",
              "cardinality": { "min": 1, "max": "*" }
            }
          ]
        }
      ],
      "relationships": [
        {
          "name": "requires",
          "type": "hasA",
          "source": "Mission",
          "target": "Resource"
        }
      ]
    }
  }
}
```

## 2. Service Architecture Integration

### Ontology Workspace Service Enhancement
```typescript
// Enhanced service for MVP
interface OntologyConfigurationService {
  // Bootstrap from JSON templates
  bootstrapFromTemplate(templateName: string, projectId: string): Promise<string>;
  
  // Dynamic schema management
  createEntityDefinition(ontologyId: string, entity: EntityDefinition): Promise<string>;
  updateEntityDefinition(entityId: string, updates: Partial<EntityDefinition>): Promise<void>;
  
  // Property management
  addPropertyToEntity(entityId: string, property: PropertyDefinition): Promise<string>;
  updatePropertyDefinition(propertyId: string, updates: Partial<PropertyDefinition>): Promise<void>;
  
  // Validation
  validateEntityStructure(entityId: string, data: object): Promise<ValidationResult>;
  validateRelationship(relationshipId: string, sourceData: object, targetData: object): Promise<ValidationResult>;
  
  // Runtime schema access
  getEntitySchema(entityId: string): Promise<EntitySchema>;
  getProjectOntology(projectId: string): Promise<ProjectOntologySchema>;
}
```

### DataManager Service Integration
```typescript
// Enhanced data validation using ontology schemas
interface DataValidationService {
  // Validate data against ontology
  validateAgainstOntology(data: any, ontologyId: string): Promise<ValidationResult>;
  
  // Apply ontological tags automatically
  applyOntologyTags(data: any, projectId: string): Promise<string[]>;
  
  // Extract entities based on ontology definitions
  extractEntitiesFromData(data: any, ontologyId: string): Promise<EntityInstance[]>;
}
```

## 3. MVP Implementation Strategy

### Phase 1: JSON Bootstrap (Week 1)
1. Create essential JSON templates for common domains
2. Implement basic JSON-to-database loader
3. Provide simple CRUD operations for ontology management

### Phase 2: Dynamic Management (Week 2-3)
1. Build UI for ontology editing in Ontology Workspace
2. Implement runtime validation using database schemas
3. Add project-specific ontology customization

### Phase 3: Advanced Features (Post-MVP)
1. Version management for ontology schemas
2. Ontology merging and conflict resolution
3. AI-assisted ontology generation from documents

## 4. Benefits of This Approach

### For MVP:
- **Quick Start**: JSON templates provide immediate functionality
- **Flexibility**: Database storage allows runtime modifications
- **Project Isolation**: Each project can have custom ontologies
- **Validation**: Built-in data validation against schemas

### For Scale:
- **Performance**: Database queries vs. file parsing
- **Concurrency**: Multiple users can modify safely
- **Versioning**: Track changes and rollback capabilities
- **Integration**: Seamless integration with other DADMS services

## 5. Implementation Code Examples

### Ontology Configuration API
```typescript
// API endpoint for MVP
app.post('/ontology/projects/:projectId/bootstrap', async (req, res) => {
  const { projectId } = req.params;
  const { template_name } = req.body;
  
  try {
    const ontologyId = await ontologyService.bootstrapFromTemplate(template_name, projectId);
    res.json({ success: true, ontology_id: ontologyId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/ontology/:ontologyId/schema', async (req, res) => {
  const { ontologyId } = req.params;
  
  try {
    const schema = await ontologyService.getOntologySchema(ontologyId);
    res.json(schema);
  } catch (error) {
    res.status(404).json({ success: false, error: 'Ontology not found' });
  }
});
```

### Data Validation Integration
```typescript
// Validate data against project ontology
app.post('/data/validate', async (req, res) => {
  const { project_id, data, entity_type } = req.body;
  
  try {
    const ontology = await ontologyService.getProjectOntology(project_id);
    const validation = await dataService.validateAgainstOntology(data, ontology.id);
    
    res.json({
      valid: validation.isValid,
      errors: validation.errors,
      suggestions: validation.suggestions
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

## 6. Migration Strategy

1. **Start with JSON**: Use JSON files for initial MVP development
2. **Parallel Database Setup**: Build database schema alongside JSON usage
3. **Gradual Migration**: Move JSON configurations to database incrementally
4. **Hybrid Period**: Support both JSON templates and database schemas
5. **Full Migration**: Eventually deprecate JSON files for production

This approach gives you the speed of JSON configuration for MVP while building toward a robust, scalable solution that aligns with your clean architecture principles.
