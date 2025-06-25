#!/bin/bash

# DADM Release Script v0.12.1
# This script helps with the release procedure for version 0.12.1

set -e

echo "🚀 Starting DADM v0.12.1 Release Procedure"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "setup.py" ]; then
    echo "❌ Error: Please run this script from the DADM root directory"
    exit 1
fi

# Check git status
echo "📋 Checking git status..."
if ! command -v git &> /dev/null; then
    echo "❌ Error: Git is not installed or not in PATH"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Check if we have uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes"
    echo "   Please commit or stash your changes before proceeding"
    git status --short
    echo ""
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Release cancelled"
        exit 1
    fi
fi

# Verify version numbers
echo "🔍 Verifying version numbers..."
PYTHON_VERSION=$(python -c "import scripts; print(scripts.__version__)" 2>/dev/null || echo "Error")
SRC_VERSION=$(python -c "import src; print(src.__version__)" 2>/dev/null || echo "Error")

echo "   scripts/__init__.py: $PYTHON_VERSION"
echo "   src/__init__.py: $SRC_VERSION"

if [ "$PYTHON_VERSION" != "0.12.1" ] || [ "$SRC_VERSION" != "0.12.1" ]; then
    echo "❌ Error: Version numbers are not set to 0.12.1"
    echo "   Please update the version numbers in scripts/__init__.py and src/__init__.py"
    exit 1
fi

echo "✅ Version numbers verified"

# Check if we're on the feature branch
if [ "$CURRENT_BRANCH" = "feature/add_properties_panel" ]; then
    echo "🔄 On feature branch, preparing to merge..."
    
    # Check if main/master branch exists
    if git show-ref --verify --quiet refs/heads/main; then
        TARGET_BRANCH="main"
    elif git show-ref --verify --quiet refs/heads/master; then
        TARGET_BRANCH="master"
    else
        echo "❌ Error: Neither main nor master branch found"
        exit 1
    fi
    
    echo "🎯 Target branch: $TARGET_BRANCH"
    
    # Check if we can merge
    echo "🔍 Checking for merge conflicts..."
    git fetch origin
    git merge-tree $(git merge-base HEAD origin/$TARGET_BRANCH) HEAD origin/$TARGET_BRANCH > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "⚠️  Warning: Potential merge conflicts detected"
        echo "   Please resolve conflicts manually before proceeding"
        read -p "Do you want to continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "❌ Release cancelled"
            exit 1
        fi
    else
        echo "✅ No merge conflicts detected"
    fi
    
    # Perform the merge
    echo "🔄 Merging $CURRENT_BRANCH into $TARGET_BRANCH..."
    git checkout $TARGET_BRANCH
    git pull origin $TARGET_BRANCH
    git merge $CURRENT_BRANCH --no-ff -m "Merge feature/add_properties_panel for v0.12.1 release"
    
    echo "✅ Merge completed successfully"
    
elif [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
    echo "✅ Already on main branch"
else
    echo "⚠️  Warning: Not on expected branch"
    echo "   Expected: feature/add_properties_panel, main, or master"
    echo "   Current: $CURRENT_BRANCH"
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Release cancelled"
        exit 1
    fi
fi

# Create release tag
echo "🏷️  Creating release tag..."
git tag -a v0.12.1 -m "Release v0.12.1: Enhanced BPMN Properties Panel and User Experience"

# Push changes
echo "📤 Pushing changes to remote..."
git push origin HEAD
git push origin v0.12.1

echo ""
echo "🎉 DADM v0.12.1 Release Completed Successfully!"
echo "================================================"
echo ""
echo "📋 Release Summary:"
echo "   • Enhanced BPMN Properties Panel with context-aware display"
echo "   • Real-time validation system with immediate feedback"
echo "   • Optimized save operations with 70% reduction in API calls"
echo "   • Professional UI with status indicators and animations"
echo ""
echo "📚 Documentation:"
echo "   • Release Summary: RELEASE_v0.12.1_SUMMARY.md"
echo "   • Release Notes: release_notes_v0.12.1.md"
echo "   • Changelog: changelog.md"
echo ""
echo "🔗 Next Steps:"
echo "   1. Verify the release on the remote repository"
echo "   2. Update any deployment configurations"
echo "   3. Notify stakeholders about the new release"
echo "   4. Begin planning for v0.13.0"
echo ""
echo "✅ Release procedure completed!" 