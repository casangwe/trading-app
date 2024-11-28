#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Ensure the script is executed in the correct directory
cd "$(dirname "$0")"

# Step 1: Pull the latest code from GitHub
echo "Pulling latest code from GitHub..."
git reset --hard
git pull origin main
echo "Code updated from GitHub."

# Step 2: Copy necessary files (like .env)
if [ -f ".env" ]; then
    echo ".env file already exists."
else
    echo "No .env file found. Please ensure it is copied before running the setup."
    exit 1
fi

# Step 3: Create virtual environment if not already present
echo "Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "Virtual environment created."
else
    echo "Virtual environment already exists."
fi

# Step 4: Activate the virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Step 5: Install dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Step 6: Stop any running process on port 8000
echo "Stopping any running backend server..."
PIDS=$(lsof -t -i:8000)
if [ -n "$PIDS" ]; then
    echo "Stopping process on port 8000 with PIDs: $PIDS..."
    kill -9 $PIDS && echo "Processes stopped." || echo "Failed to stop processes."
else
    echo "No process running on port 8000."
fi

# Step 7: Start the backend server
echo "Starting backend server..."
nohup python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 &
echo "Backend server started. Logs are in backend.log."
