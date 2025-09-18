#!/bin/bash

# Atem Branch Switcher
# Usage: ./switch-branch.sh [master|experimental]

if [ "$1" = "master" ]; then
    echo "🛡️  Switching to MASTER (sacred stable copy)..."
    git checkout main
    echo "✅ You're now on the stable master branch"
    echo "🚀 Run: npm run dev"
elif [ "$1" = "experimental" ]; then
    echo "🧪 Switching to EXPERIMENTAL (playground for changes)..."
    git checkout experimental
    echo "✅ You're now on the experimental branch"
    echo "🚀 Run: npm run dev"
else
    echo "📋 Available branches:"
    echo "  ./switch-branch.sh master       - Switch to stable master"
    echo "  ./switch-branch.sh experimental - Switch to experimental playground"
    echo ""
    echo "Current branch:"
    git branch --show-current
fi
