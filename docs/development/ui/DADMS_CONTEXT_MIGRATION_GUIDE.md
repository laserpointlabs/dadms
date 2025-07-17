# DADMS Context Migration Guide

## Overview
This guide helps migrate DADMS project context to Cursor or other AI development tools while starting fresh with a clean architecture.

## Migration Strategy Options

### **Option 1: File-Based Context Migration**

#### **Step 1: Export Context Package**
```bash
# From current workspace
cd /home/jdehart/dadms
./scripts/export-context.sh
# Creates: context-export/dadms_context_TIMESTAMP.tar.gz
```

#### **Step 2: Setup New Workspace** 
```bash
# Create new workspace
mkdir ~/dadms-2.0
cd ~/dadms-2.0
git init

# Extract context
tar -xzf ~/dadm/context-export/dadms_context_*.tar.gz
cp dadms_context_*/. ./

# Initialize Cursor
cp .cursorrules ./
```

#### **Step 3: Cursor Integration**
- Open `~/dadms-2.0` in Cursor
- `.cursorrules` automatically provides project context
- Reference `DADMS_WEEK1_IMPLEMENTATION_PLAN.md` for tasks

### **Option 2: Branch-Based Development**

#### **Preserve Current Work**
```bash
# Commit current state
git add . && git commit -m "Pre-DADMS 2.0 context checkpoint"
git push origin fix/postgres_fix_after_llm_integration

# Create new development branch
git checkout -b feature/dadms-mvp-week1
git push -u origin feature/dadms-mvp-week1
```

#### **Clean Slate with Context**
```bash
# Optional: Start with clean directory structure
mkdir -p services-new/{user-project,knowledge,llm,context-manager}
mkdir -p ui-new/src/components/{ProjectDashboard,KnowledgeManager}
```

### **Option 3: Parallel Workspace Development**

#### **Create Parallel Workspace**
```bash
# Clone to parallel directory
cp -r /home/jdehart/dadms /home/jdehart/dadms-mvp
cd /home/jdehart/dadms-mvp

# Clean and prepare
./scripts/export-context.sh
# Reference context while developing clean architecture
```

## Cursor-Specific Integration

### **Using .cursorrules for Context**

The `.cursorrules` file provides Cursor with:
- **Architecture Overview**: Microservices, databases, UI components
- **Development Priorities**: Week 1-4 implementation plan
- **Key Services**: Ports, responsibilities, integration points
- **Current Status**: What exists, what needs building
- **Code Patterns**: API design, database schema, UI conventions

### **Folder Structure for Cursor**

Organize the new workspace for optimal Cursor understanding:
```
dadms-2.0/
├── .cursorrules                          # AI context
├── docs/
│   ├── DADMS_DEMONSTRATOR_SPECIFICATION.md
│   ├── DADMS_MVP_SPECIFICATION.md
│   └── DADMS_WEEK1_IMPLEMENTATION_PLAN.md
├── services/
│   ├── user-project-service/            # Week 1, Day 1
│   ├── knowledge-service/               # Week 1, Day 2  
│   ├── llm-service/                     # Week 1, Day 3
│   └── context-manager/                 # Week 2
├── ui/
│   └── src/components/                  # Week 1, Day 4
├── database/
│   └── schemas/                         # SQL files
└── docker/
    └── docker-compose.yml
```

### **Context-Aware Prompts for Cursor**

With `.cursorrules` in place, use these prompts:

```
"Implement the Project service for Day 1 of Week 1 plan"
"Create the PostgreSQL schema for project management"
"Build the Knowledge service document upload endpoint"
"Add tool calling to the LLM service"
"Create React components for project dashboard"
```

## Development Workflow

### **Daily Development Pattern**

#### **Start of Day**
1. Review `.cursorrules` for current context
2. Check `DADMS_WEEK1_IMPLEMENTATION_PLAN.md` for daily goals
3. Reference existing code in `architecture/services/` for patterns

#### **During Development**
- Use Cursor's AI suggestions with full project context
- Reference `DADMS_MVP_SPECIFICATION.md` for priorities
- Follow patterns from `copilot-instructions.md`

#### **End of Day**
- Commit progress with descriptive messages
- Update implementation status in plan documents
- Export any new context for team sharing

### **Context Synchronization**

#### **Update .cursorrules as Project Evolves**
```bash
# Append new context to .cursorrules
echo "" >> .cursorrules
echo "## Week 1 Progress" >> .cursorrules
echo "- ✅ Project service implemented" >> .cursorrules
echo "- ✅ Knowledge service with document upload" >> .cursorrules
echo "- 🔄 LLM service tool calling in progress" >> .cursorrules
```

#### **Share Context Between Tools**
```bash
# Export updated context for team
./scripts/export-context.sh
# Share: context-export/dadms_context_TIMESTAMP.tar.gz
```

## Team Collaboration

### **Onboarding New Developers**

#### **Quick Start Package**
```bash
# New developer setup
tar -xzf dadms_context_latest.tar.gz
cp .cursorrules ~/their-workspace/
# They get full project context in Cursor immediately
```

#### **Context Handoff**
- `.cursorrules`: Immediate AI context
- `DADMS_WEEK1_IMPLEMENTATION_PLAN.md`: Current development status
- `CONTEXT_SUMMARY.md`: High-level overview
- `DEVELOPMENT_PRIORITIES.md`: Week-by-week roadmap

## Troubleshooting

### **If Context is Lost**
1. Extract original context package
2. Restore `.cursorrules` file
3. Reference specification documents
4. Check git commit history for progress

### **If Cursor Doesn't Understand Context**
1. Verify `.cursorrules` is in workspace root
2. Add specific context to individual prompts
3. Reference key files explicitly: "based on DADMS_MVP_SPECIFICATION.md"

### **Context Too Large for AI Tools**
1. Use focused `.cursorrules` sections
2. Reference specific documents per conversation
3. Create topic-specific context files

## Success Indicators

### **Context Migration Complete When:**
- ✅ Cursor understands DADMS architecture without explanation
- ✅ AI suggestions align with MVP priorities
- ✅ Development tasks follow Week 1 implementation plan
- ✅ Code patterns match existing service conventions
- ✅ All team members have consistent project understanding

## Next Steps

1. **Execute Context Export**: `./scripts/export-context.sh`
2. **Setup New Workspace**: Follow Option 1, 2, or 3 above
3. **Start Week 1 Development**: Begin with Day 1 Project service
4. **Maintain Context**: Update `.cursorrules` as project evolves

Ready to migrate context and start DADMS 2.0 development! 🚀
