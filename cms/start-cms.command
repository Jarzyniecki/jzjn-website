#!/bin/bash

# JZJN CMS Launcher
# Double-click this file in Finder to start the CMS

# Get the directory where this script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to the CMS directory
cd "$DIR"

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed."
    echo "Please install Node.js from https://nodejs.org"
    read -p "Press Enter to exit..."
    exit 1
fi

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install dependencies."
        read -p "Press Enter to exit..."
        exit 1
    fi
    echo ""
fi

# Check if data files exist, if not run migration
if [ ! -f "data/homepage.json" ]; then
    echo "Running initial data migration..."
    npm run migrate
    if [ $? -ne 0 ]; then
        echo "Warning: Migration had issues, but continuing..."
    fi
    echo ""
fi

echo "Starting JZJN CMS..."
echo ""

# Open browser after a short delay
(sleep 2 && open "http://localhost:3000/admin/") &

# Start the server
npm start

# Keep terminal open on error
read -p "Press Enter to exit..."
