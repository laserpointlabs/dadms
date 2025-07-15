import swaggerJsdoc, { Options, SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'DADMS User & Project Service',
        version: '1.0.0',
        description: 'API documentation for DADMS User and Project Management Service',
        contact: {
            name: 'DADMS Team',
            email: 'support@dadms.com'
        }
    },
    servers: [
        {
            url: 'http://localhost:3001',
            description: 'Development server'
        }
    ],
    components: {
        securitySchemes: {
            UserAuth: {
                type: 'apiKey',
                in: 'header',
                name: 'user-id',
                description: 'User ID (UUID) for authentication'
            }
        },
        schemas: {
            Project: {
                type: 'object',
                required: ['id', 'name', 'description', 'owner_id', 'status', 'knowledge_domain', 'settings', 'created_at', 'updated_at'],
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid',
                        description: 'Unique identifier for the project'
                    },
                    name: {
                        type: 'string',
                        maxLength: 255,
                        description: 'Project name'
                    },
                    description: {
                        type: 'string',
                        description: 'Project description'
                    },
                    owner_id: {
                        type: 'string',
                        format: 'uuid',
                        description: 'ID of the project owner'
                    },
                    status: {
                        type: 'string',
                        enum: ['active', 'completed'],
                        description: 'Project status'
                    },
                    knowledge_domain: {
                        type: 'string',
                        maxLength: 100,
                        description: 'Knowledge domain for the project'
                    },
                    settings: {
                        type: 'object',
                        properties: {
                            default_llm: {
                                type: 'string',
                                description: 'Default LLM provider'
                            },
                            personas: {
                                type: 'array',
                                items: {
                                    type: 'string'
                                },
                                description: 'Available personas'
                            },
                            tools_enabled: {
                                type: 'array',
                                items: {
                                    type: 'string'
                                },
                                description: 'Enabled tools'
                            }
                        }
                    },
                    created_at: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Project creation timestamp'
                    },
                    updated_at: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Last update timestamp'
                    }
                }
            },
            CreateProjectRequest: {
                type: 'object',
                required: ['name', 'description', 'knowledge_domain'],
                properties: {
                    name: {
                        type: 'string',
                        maxLength: 255,
                        description: 'Project name'
                    },
                    description: {
                        type: 'string',
                        maxLength: 1000,
                        description: 'Project description'
                    },
                    knowledge_domain: {
                        type: 'string',
                        maxLength: 100,
                        description: 'Knowledge domain for the project'
                    },
                    settings: {
                        type: 'object',
                        properties: {
                            default_llm: {
                                type: 'string',
                                description: 'Default LLM provider'
                            },
                            personas: {
                                type: 'array',
                                items: {
                                    type: 'string'
                                },
                                description: 'Available personas'
                            },
                            tools_enabled: {
                                type: 'array',
                                items: {
                                    type: 'string'
                                },
                                description: 'Enabled tools'
                            }
                        }
                    }
                }
            },
            ProjectListResponse: {
                type: 'object',
                properties: {
                    projects: {
                        type: 'array',
                        items: {
                            $ref: '#/components/schemas/Project'
                        }
                    },
                    total: {
                        type: 'integer',
                        description: 'Total number of projects'
                    },
                    page: {
                        type: 'integer',
                        description: 'Current page number'
                    },
                    limit: {
                        type: 'integer',
                        description: 'Items per page'
                    }
                }
            },
            ApiResponse: {
                type: 'object',
                properties: {
                    success: {
                        type: 'boolean',
                        description: 'Indicates if the request was successful'
                    },
                    data: {
                        description: 'Response data'
                    },
                    error: {
                        type: 'string',
                        description: 'Error type (if applicable)'
                    },
                    message: {
                        type: 'string',
                        description: 'Response message'
                    },
                    timestamp: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Response timestamp'
                    }
                }
            }
        }
    }
};

const options: Options = {
    definition: swaggerDefinition,
    apis: [
        './src/routes/*.ts',
        './src/controllers/*.ts'
    ]
};

export const swaggerSpec = swaggerJsdoc(options); 