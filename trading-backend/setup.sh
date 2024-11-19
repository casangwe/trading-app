#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Ensure the script is executed in the correct directory
cd "$(dirname "$0")"

# Create virtual environment if not already present
echo "Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "Virtual environment created."
else
    echo "Virtual environment already exists."
fi

# Activate the virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Check and configure .env file
if [ ! -f ".env" ]; then
    echo "Warning: .env file is missing! Please configure it in the trading-backend directory."
else
    echo ".env file found and configured."
fi
