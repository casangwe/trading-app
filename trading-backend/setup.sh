#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Create virtual environment
echo "Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
else
    echo "Virtual environment already exists."
fi

# Activate the virtual environment based on platform
echo "Activating virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    source venv/Scripts/activate
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux (e.g., EC2)
    source venv/bin/activate
else
    echo "Unsupported operating system: $OSTYPE"
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Reminder to configure .env
if [ ! -f ".env" ]; then
    echo "Warning: .env file is missing! Please configure it in the trading-backend directory."
else
    echo ".env file found and configured."
fi

# Start the application
echo "Starting the application..."
uvicorn main:app --reload --host 0.0.0.0 --port 8000
