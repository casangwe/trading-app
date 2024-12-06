#!/bin/bash

# Step 1: Pull the latest changes from Git
echo "Pulling latest changes from Git..."
git pull origin main
echo "Code updated from GitHub."


# Step 2: Navigate to the frontend directory and start the frontend server
echo "Starting the frontend server..."
cd trading-frontend
npm install 
npm start & 

# Step 3: Navigate to the backend directory
echo "Starting the backend server..."
cd ../trading-backend

# Activate the virtual environment
source venvp/bin/activate

# Start the backend server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1
