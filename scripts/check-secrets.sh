#!/bin/bash

# Script to check for potential API key leaks before committing

echo "Checking for potential secrets..."

# Patterns to search for
PATTERNS=(
    "AIzaSy[a-zA-Z0-9_-]{33}"  # Firebase API keys
    "AAAA[a-zA-Z0-9_-]{33}"    # Firebase App IDs
    "finsync-v2"               # Specific project ID
    "418670155712"             # Messaging sender ID
)

FOUND_SECRETS=0

for pattern in "${PATTERNS[@]}"; do
    echo "Checking for: $pattern"
    if git diff --cached --name-only | xargs grep -l "$pattern" 2>/dev/null; then
        echo "❌ FOUND potential secret matching pattern: $pattern"
        git diff --cached --name-only | xargs grep -n "$pattern" 2>/dev/null || true
        FOUND_SECRETS=1
    fi
done

if [ $FOUND_SECRETS -eq 1 ]; then
    echo ""
    echo "❌ COMMIT BLOCKED: Potential secrets detected!"
    echo "Please remove sensitive information before committing."
    exit 1
else
    echo "✅ No secrets detected"
    exit 0
fi