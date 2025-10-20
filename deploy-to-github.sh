#!/bin/bash

# Muskskito GitHub Deployment Script
# This script automates the deployment process to GitHub

set -e  # Exit on error

echo "🚀 Muskskito GitHub Deployment Script"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if GitHub username is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: GitHub username required${NC}"
    echo "Usage: ./deploy-to-github.sh YOUR_GITHUB_USERNAME"
    exit 1
fi

GITHUB_USERNAME=$1
REPO_NAME="muskskito"
REPO_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

echo -e "${YELLOW}GitHub Username:${NC} $GITHUB_USERNAME"
echo -e "${YELLOW}Repository Name:${NC} $REPO_NAME"
echo -e "${YELLOW}Repository URL:${NC} $REPO_URL"
echo ""

# Step 1: Check if repository exists locally
echo -e "${GREEN}Step 1: Checking local repository...${NC}"
if [ ! -d ".git" ]; then
    echo -e "${RED}Error: Not a git repository${NC}"
    exit 1
fi
echo "✅ Local repository found"
echo ""

# Step 2: Add LICENSE file
echo -e "${GREEN}Step 2: Adding MIT License...${NC}"
if [ ! -f "LICENSE" ]; then
    cat > LICENSE << 'LICENSEEOF'
MIT License

Copyright (c) 2025 Muskskito Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
LICENSEEOF
    git add LICENSE
    git commit -m "Add MIT License"
    echo "✅ LICENSE file created and committed"
else
    echo "✅ LICENSE file already exists"
fi
echo ""

# Step 3: Add GitHub templates
echo -e "${GREEN}Step 3: Adding GitHub templates...${NC}"
mkdir -p .github/ISSUE_TEMPLATE

# Bug report template
cat > .github/ISSUE_TEMPLATE/bug_report.md << 'BUGEOF'
---
name: Bug Report
about: Report a bug to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

## Bug Description
A clear and concise description of the bug.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What you expected to happen.

## Screenshots
If applicable, add screenshots.

## Environment
- OS: [e.g., Ubuntu 22.04]
- Browser: [e.g., Chrome 120]
- Node Version: [e.g., 22.13.0]
BUGEOF

# Feature request template
cat > .github/ISSUE_TEMPLATE/feature_request.md << 'FEATUREEOF'
---
name: Feature Request
about: Suggest a new feature
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

## Feature Description
A clear description of the feature.

## Problem Statement
What problem does this solve?

## Proposed Solution
How should this work?
FEATUREEOF

# Pull request template
cat > .github/PULL_REQUEST_TEMPLATE.md << 'PREOF'
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] All tests pass
PREOF

git add .github/
git commit -m "Add GitHub issue and PR templates"
echo "✅ GitHub templates created"
echo ""

# Step 4: Check for remote
echo -e "${GREEN}Step 4: Configuring remote repository...${NC}"
if git remote | grep -q "origin"; then
    CURRENT_REMOTE=$(git remote get-url origin)
    echo "⚠️  Remote 'origin' already exists: $CURRENT_REMOTE"
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git remote set-url origin $REPO_URL
        echo "✅ Remote updated to: $REPO_URL"
    fi
else
    git remote add origin $REPO_URL
    echo "✅ Remote added: $REPO_URL"
fi
echo ""

# Step 5: Rename branch to main
echo -e "${GREEN}Step 5: Renaming branch to main...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    git branch -M main
    echo "✅ Branch renamed to 'main'"
else
    echo "✅ Already on 'main' branch"
fi
echo ""

# Step 6: Push to GitHub
echo -e "${GREEN}Step 6: Pushing to GitHub...${NC}"
echo "⚠️  You will be prompted for GitHub credentials"
echo "   Use Personal Access Token as password"
echo "   Generate at: https://github.com/settings/tokens"
echo ""
read -p "Ready to push? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if git push -u origin main; then
        echo "✅ Successfully pushed to GitHub!"
    else
        echo -e "${RED}❌ Push failed. Check your credentials and try again.${NC}"
        exit 1
    fi
else
    echo "⏸️  Push cancelled. Run this script again when ready."
    exit 0
fi
echo ""

# Step 7: Create release tag
echo -e "${GREEN}Step 7: Creating release tag...${NC}"
read -p "Create v1.0.0 release tag? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git tag -a v1.0.0 -m "Initial release - Muskskito v1.0.0"
    git push origin v1.0.0
    echo "✅ Release tag v1.0.0 created and pushed"
else
    echo "⏸️  Skipped release tag creation"
fi
echo ""

# Success message
echo ""
echo "======================================"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "======================================"
echo ""
echo "Your repository is now live at:"
echo -e "${GREEN}https://github.com/$GITHUB_USERNAME/$REPO_NAME${NC}"
echo ""
echo "Next steps:"
echo "1. Visit your repository on GitHub"
echo "2. Add repository topics (Settings → About)"
echo "3. Create a release (if not done above)"
echo "4. Share with the community!"
echo ""
echo "For detailed deployment guide, see:"
echo "- DEPLOYMENT.md"
echo "- GITHUB_DEPLOYMENT_PLAN.md"
echo ""
