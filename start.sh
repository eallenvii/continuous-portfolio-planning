#!/bin/bash
export LOG_LEVEL=DEBUG
export VITE_LOG_LEVEL=verbose

echo "Starting Python backend on port 8000 with LOG_LEVEL=$LOG_LEVEL..."
python -m uvicorn server_python.main:app --host 0.0.0.0 --port 8000 --reload &
PYTHON_PID=$!
sleep 2

echo "Starting Node.js frontend on port 5000..."
NODE_ENV=development npx tsx server/index-dev.ts

kill $PYTHON_PID 2>/dev/null
