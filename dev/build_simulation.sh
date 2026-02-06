#!/usr/bin/env bash
set -e

echo "🧹 Step 1/4: Clearing build cache..."
rm -rf _build/site

echo "📦 Step 2/4: Building book to pull latest templates..."
jupyter book build

echo "🔧 Step 3/4: Injecting custom server.js with PyScript integration..."
cp _static/js/server.js _build/templates/site/myst/book-theme/server.js

echo "🚀 Step 4/4: Starting Jupyter Book server..."
echo "📍 Server will be available at http://localhost:3000"
echo "Press Ctrl+C to stop"
jupyter book start
