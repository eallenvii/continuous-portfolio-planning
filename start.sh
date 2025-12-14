#!/bin/bash
echo "Starting Python backend on port 8000..."
python -m uvicorn server_python.main:app --host 0.0.0.0 --port 8000 &
PYTHON_PID=$!
sleep 2

echo "Starting Node.js frontend on port 5000..."
NODE_ENV=development npx tsx server/index-dev.ts

kill $PYTHON_PID 2>/dev/null
