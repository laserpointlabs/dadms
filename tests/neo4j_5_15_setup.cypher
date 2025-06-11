// Neo4j Browser 5.15.0 - How to Set Node Captions

// STEP 1: Run this query to see your nodes
MATCH (n) WHERE n.name IS NOT NULL RETURN n LIMIT 25;

// STEP 2: After the graph appears, look for these UI elements:
// - There should be a small panel at the bottom of the graph view
// - OR look for icons in the graph toolbar (usually at the top or bottom of the graph)
// - Look for a "legend" or node type list on the left side of the graph

// STEP 3: In Neo4j Browser 5.15.0, you need to:
// 1. Click on a node TYPE in the legend (left side) - not individual nodes
// 2. This should open a styling panel 
// 3. Look for "Caption" or "Label" dropdown
// 4. Change it from "id" or "label" to "name"

// ALTERNATIVE: Try this configuration command for 5.15.0
:config {browser: {retain_connection_credentials: true}}

// If the above doesn't work, try this direct styling approach:
// Click on each node type in the legend and manually set the caption

// VERIFICATION: Run this to see the names in table format
MATCH (n:Stakeholder) 
RETURN n.name as StakeholderName, n.key as Key
LIMIT 5;

MATCH (n:Alternative) 
RETURN n.name as AlternativeName, n.key as Key  
LIMIT 5;

MATCH (n:Value)
RETURN n.name as ValueName, n.key as Key
LIMIT 5;

// If you still can't find the styling options, try:
// 1. Right-click on the graph background
// 2. Look for "Settings" or "Display options"
// 3. Check the main Neo4j Browser menu (three lines or hamburger menu)
