// Neo4j Browser display configuration for DADM graph
// This script configures how nodes are displayed in Neo4j Browser

// Set up node captions for all node types to show the 'name' property
:config visualizationSettings.{"node.caption": "name"}

// Return some example nodes to verify display settings
MATCH (n)
WHERE n.name IS NOT NULL
RETURN n LIMIT 25;

// Show nodes by type to verify display
MATCH (n:Stakeholder) RETURN n LIMIT 5;
MATCH (n:Alternative) RETURN n LIMIT 5;
MATCH (n:Criterion) RETURN n LIMIT 5;
MATCH (n:Value) RETURN n LIMIT 5;
MATCH (n:Recommendation) RETURN n LIMIT 5;

// Display relationships
MATCH p=(:Analysis)-[]->(n) RETURN p LIMIT 10;
MATCH p=(:Stakeholder)-[]->(n) RETURN p LIMIT 10;
MATCH p=(:Alternative)-[]->(n) RETURN p LIMIT 10;
MATCH p=(:Recommendation)-[]->(n) RETURN p LIMIT 10;

// Count nodes by type
MATCH (n)
RETURN labels(n)[0] AS NodeType, count(*) AS Count
ORDER BY Count DESC;
