export const handlers = {
    standards_ingestion: async (task: any) => {
        console.log('[handler] standards_ingestion', {
            id: task.id,
            vars: task.variables || {},
        });
    },
    ontology_extraction: async (task: any) => {
        console.log('[handler] ontology_extraction', {
            id: task.id,
            vars: task.variables || {},
        });
    },
    ontology_alignment: async (task: any) => {
        console.log('[handler] ontology_alignment', {
            id: task.id,
            vars: task.variables || {},
        });
    },
    pipeline_generation: async (task: any) => {
        console.log('[handler] pipeline_generation', {
            id: task.id,
            vars: task.variables || {},
        });
    },
    visualization_prototype: async (task: any) => {
        console.log('[handler] visualization_prototype', {
            id: task.id,
            vars: task.variables || {},
        });
    },
    semantic_testing: async (task: any) => {
        console.log('[handler] semantic_testing', {
            id: task.id,
            vars: task.variables || {},
        });
    },
};


