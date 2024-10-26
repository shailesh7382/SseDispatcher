#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Define the project directories
PROJECT_ROOT=$(pwd)
TICKER_DIR="${PROJECT_ROOT}/sse-price-ticker"
TARGET_DIR="${PROJECT_ROOT}/src/main/resources/static"

# Log the start of the script
echo "Starting build and copy process..."

# Navigate to the sse-price-ticker directory
echo "Navigating to the sse-price-ticker directory..."
cd "$TICKER_DIR"

# Install npm dependencies
echo "Installing npm dependencies..."
npm install

# Build the React app
echo "Building the React app..."
npm run build

# Navigate back to the project root directory
echo "Navigating back to the project root directory..."
cd "$PROJECT_ROOT"

# Create the target directory if it doesn't exist
echo "Creating the target directory if it doesn't exist..."
mkdir -p "$TARGET_DIR"

# Copy the build output to the target directory
echo "Copying the build output to the target directory..."
cp -r "${TICKER_DIR}/build/"* "$TARGET_DIR/"

# Log the completion of the script
echo "Build and copy process completed successfully."