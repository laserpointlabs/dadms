# DADMS Git Workflow Guide

## 🚨 Branch Protection Rule

**NEVER work directly on main branch for significant changes!**

This rule is now mandatory for all DADMS development to ensure code quality, prevent main branch issues, and maintain proper version control practices.

## Quick Start

### Using the Helper Script (Recommended)

```bash
# Check what branch you're currently on
git branch --show-current

# Create a new feature branch
./scripts/dev/create-branch.sh feature user-authentication

# Create a bug fix branch
./scripts/dev/create-branch.sh fix neo4j-startup-issues

# Create documentation branch
./scripts/dev/create-branch.sh docs api-updates

# Create infrastructure branch
./scripts/dev/create-branch.sh infra docker-optimization

# Create experimental branch
./scripts/dev/create-branch.sh experiment ml-integration
```

### Manual Branch Creation

```bash
# For new features
git checkout -b feature/description-of-work

# For bug fixes
git checkout -b fix/issue-description

# For documentation
git checkout -b docs/update-description

# For infrastructure
git checkout -b infra/change-description

# For experiments
git checkout -b experiment/research-topic
```

## When Branch Creation is REQUIRED

✅ **Create a branch for:**
- Any code changes to services, UI, or infrastructure
- New feature development or significant enhancements
- Bug fixes that modify more than trivial content
- Configuration changes to Docker, environment, or deployment
- Database schema or migration changes
- Architecture modifications or new service additions
- Performance optimizations or refactoring work
- Security updates or dependency changes
- System stabilization work (like Neo4j startup fixes)

## Safe for Main Branch (Exceptions)

📝 **Safe to work directly on main:**
- Minor documentation fixes (typos, formatting only)
- Small configuration tweaks (single environment variables)
- Adding log statements or debugging info only
- Code formatting (linting fixes only, no logic changes)

## Complete Workflow

### 1. Before Starting Work

```bash
# Check current branch
git branch --show-current

# Make sure you're on main and up to date
git checkout main
git pull origin main

# Create your feature branch
./scripts/dev/create-branch.sh feature my-new-feature
```

### 2. During Development

```bash
# Make your changes, then commit regularly
git add .
git commit -m "Add: descriptive commit message"

# Push to remote (first time)
git push -u origin feature/my-new-feature

# Subsequent pushes
git push
```

### 3. When Ready to Merge

```bash
# Make sure your branch is up to date with main
git checkout main
git pull origin main
git checkout feature/my-new-feature
git merge main

# Resolve any conflicts, then push
git push

# Create Pull Request through GitHub/GitLab interface
```

### 4. After Merge

```bash
# Switch back to main and update
git checkout main
git pull origin main

# Delete the merged branch locally
git branch -d feature/my-new-feature

# Delete the remote branch (if needed)
git push origin --delete feature/my-new-feature
```

## Branch Naming Conventions

### Prefixes
- `feature/` - New features or enhancements
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `infra/` - Infrastructure changes
- `experiment/` - Research or experimental work

### Description Guidelines
- Use lowercase letters
- Separate words with hyphens
- Be descriptive but concise
- Max 50 characters total

### Examples
- ✅ `feature/user-authentication`
- ✅ `fix/neo4j-startup-issues`
- ✅ `docs/api-documentation-update`
- ✅ `infra/docker-compose-optimization`
- ✅ `experiment/ml-model-integration`
- ❌ `feature/stuff` (too vague)
- ❌ `fix/Fix_Bug_With_Stuff` (poor formatting)

## Commit Message Guidelines

### Format
```
Type: Short description (50 chars max)

Optional longer description explaining what and why.
Focus on the reasoning behind the change.
```

### Types
- **Add:** New features, files, or functionality
- **Fix:** Bug fixes or corrections
- **Update:** Modifications to existing features
- **Remove:** Deletion of features, files, or code
- **Refactor:** Code restructuring without changing functionality
- **Docs:** Documentation changes
- **Style:** Formatting, whitespace, etc.
- **Test:** Adding or updating tests

### Examples
- ✅ `Add: user authentication service with JWT tokens`
- ✅ `Fix: Neo4j startup consistency issues with health checks`
- ✅ `Update: Docker Compose configuration for better stability`
- ✅ `Refactor: extract common database connection logic`
- ❌ `fixed stuff` (unclear and no proper format)
- ❌ `WIP` (not descriptive)

## Helper Script Features

The `./scripts/dev/create-branch.sh` script provides:

- ✅ **Validation:** Ensures proper branch naming
- ✅ **Conflict Detection:** Checks if branch already exists
- ✅ **Current Branch Warning:** Alerts if not on main
- ✅ **Automatic Formatting:** Converts spaces to hyphens, lowercase
- ✅ **Type Validation:** Ensures valid branch type
- ✅ **Guidance:** Provides next steps after branch creation

## Troubleshooting

### "Branch already exists"
```bash
# List all branches
git branch -a

# Switch to existing branch
git checkout existing-branch-name

# Or create with different name
./scripts/dev/create-branch.sh feature my-feature-v2
```

### "Not on main branch"
```bash
# Check current branch
git branch --show-current

# Switch to main
git checkout main

# Update main
git pull origin main

# Create new branch
./scripts/dev/create-branch.sh feature my-feature
```

### "Conflicts during merge"
```bash
# During merge, resolve conflicts in files
# Edit conflicted files, remove conflict markers
git add .
git commit -m "Resolve merge conflicts"
git push
```

## Best Practices

1. **Keep branches focused:** One feature/fix per branch
2. **Commit frequently:** Small, logical commits are easier to review
3. **Write descriptive commits:** Future you will thank you
4. **Test before merging:** Ensure all tests pass
5. **Keep branches up to date:** Regularly merge main into feature branches
6. **Clean up:** Delete merged branches to keep repository tidy
7. **Use the helper script:** It prevents common mistakes

---

This workflow ensures code quality, prevents main branch issues, and maintains a clean development history for the DADMS project.