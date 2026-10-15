#!/usr/bin/env bash
# AI Product Damage Detection and Visualization System
# Startup script for Backend (FastAPI + PyTorch) & Frontend (React + Vite)

echo "🚀 Starting AI Product Damage Detection System..."

# 1. Start Python FastAPI Backend in background
echo "📦 Starting FastAPI CNN Backend on port 8000..."
python3 backend/main.py &
BACKEND_PID=$!

# 2. Wait 2 seconds for backend initialization
sleep 2

# 3. Start Frontend
echo "💻 Starting React Vite Frontend on port 8080..."
npm run dev

# Cleanup when frontend terminates
kill $BACKEND_PID
