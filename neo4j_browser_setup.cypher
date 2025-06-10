// Updated Neo4j Browser Display Configuration
// For Neo4j Browser 5.x and newer

// Method 1: Click on a node, then look for the "Style" panel
// 1. Run this query first:
MATCH (n) RETURN n LIMIT 25;

// 2. Click on any node in the visualization
// 3. Look for a "Style" panel that appears (usually on the right or bottom)
// 4. In the Style panel, change the "Caption" dropdown from "<id>" to "name"

// Method 2: Use the brush/palette icon
// 1. Look for a brush or palette icon in the toolbar
// 2. Click it to open style settings
// 3. Set caption to use the "name" property

// Method 3: Manual styling for each node type
// Run these commands to set specific styles:

// Style for Stakeholder nodes
MATCH (n:Stakeholder) 
WITH n LIMIT 1
RETURN n;
// After this appears, click the node, find style settings, set caption to "name"

// Style for Alternative nodes  
MATCH (n:Alternative) 
WITH n LIMIT 1
RETURN n;
// Click node, set caption to "name"

// Style for Value nodes
MATCH (n:Value) 
WITH n LIMIT 1
RETURN n;
// Click node, set caption to "name"

// Style for Recommendation nodes
MATCH (n:Recommendation) 
WITH n LIMIT 1
RETURN n;
// Click node, set caption to "name"

// Method 4: Check Neo4j Browser settings
// Look for:
// - Settings icon (gear) in the top-right or sidebar
// - Browser settings or visualization settings
// - Graph visualization preferences

// Method 5: Force refresh and check current data
MATCH (n) 
WHERE n.name IS NOT NULL AND n.name <> 'None'
RETURN n.name as NodeName, labels(n) as NodeType
LIMIT 10;

// This will show you the actual names in a table format to verify they exist
