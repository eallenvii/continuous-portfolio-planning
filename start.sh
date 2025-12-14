#!/bin/bash
python run_backend.py &
PYTHON_PID=$!
sleep 2
NODE_ENV=development npx tsx server/index-dev.ts
kill $PYTHON_PID 2>/dev/null
