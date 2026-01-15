#!/bin/bash

# Optimal Pick Assistant - Development Script
# Starts both backend and frontend in development mode

set -e

echo "🎮 Starting Optimal Pick Assistant Development Environment"
echo "==========================================================="
echo ""

# Check if dependencies are installed
if [ ! -d "backend/node_modules" ] || [ ! -d "frontend/node_modules" ]; then
    echo "⚠️  Dependencies not found. Running setup first..."
    ./scripts/setup.sh
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend in background
echo "🚀 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait for backend to be ready
echo "   Waiting for backend to start..."
sleep 3

# Start frontend in background
echo "🚀 Starting frontend server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

echo ""
echo "✅ Development environment ready!"
echo ""
echo "📍 URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo "   API Docs: http://localhost:3001/api/status"
echo ""
echo "🎯 To use the app:"
echo "   1. Start League of Legends client"
echo "   2. Open http://localhost:5173 in your browser"
echo "   3. Enter champion select in League"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Keep script running
wait