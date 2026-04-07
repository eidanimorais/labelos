#!/bin/bash

# Kill ports if running
cd "$(dirname "$0")/.."

# Kill ports if running
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# Start Backend
echo "Starting Backend (API)..."
python3 -m pip install -r apps/api/requirements.txt
# Run from root, assuming apps/api is a package
python3 -m uvicorn apps.api.main:app --reload --port 8000 > apps/api/backend.log 2>&1 &
BACKEND_PID=$!

# Start Frontend
echo "Starting Frontend (Web)..."
cd apps/web
npm install
npm run dev > ../../apps/web/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ../../

echo "Application running!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "Press CTRL+C to stop."

# Wait
wait $BACKEND_PID $FRONTEND_PID
