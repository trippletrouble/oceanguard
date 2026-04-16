#!/bin/bash
echo " Starting OceanGuard..."

# Backend starten
echo " Starting Backend..."
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Frontend starten
echo "  Starting Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "  OceanGuard is running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both..."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait# write some script to start both servers at the same time
