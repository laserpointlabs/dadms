// Direct Neo4j Browser Commands - Copy and paste these ONE AT A TIME

// Step 1: First, let's see what we have
MATCH (n) RETURN n LIMIT 10;

// Step 2: After running the above, look at the visualization that appears
// You should see nodes connected by lines

// Step 3: Try this configuration command (works in some Neo4j versions)
:config {initialNodeDisplay: 'name', nodeCountDisplay: 'name'}

// Step 4: Alternative config command
:config {
  "initialNodeDisplay": "name",
  "maxFrames": 30,
  "theme": "auto"
}

// Step 5: If configs don't work, try clicking on individual node types
// Run this to show just Stakeholder nodes:
MATCH (n:Stakeholder) RETURN n LIMIT 3;

// After nodes appear, try these actions:
// - Click directly on a node (not just hover)
// - Look for any popup or panel that appears when you click
// - Check if there's a properties panel on the right side
// - Look for any "..." menu on nodes

// Step 6: Show table view to verify names exist
MATCH (n:Stakeholder) 
RETURN n.name AS StakeholderName, n.key AS Key
LIMIT 5;

// Step 7: Show all node types with their names in table format
MATCH (n) 
WHERE n.name IS NOT NULL 
RETURN labels(n)[0] AS NodeType, n.name AS NodeName, n.key AS Key
ORDER BY NodeType
LIMIT 20;
