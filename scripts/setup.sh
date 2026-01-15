#!/bin/bash

# Optimal Pick Assistant - Setup Script
# This script automates the initial setup process

set -e

echo "🎮 Optimal Pick Assistant - Setup Script"
echo "=========================================="
echo ""

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "⚠️  Node.js version $NODE_VERSION detected. Version 20+ is recommended."
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
echo "✅ Backend dependencies installed"
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install
echo "✅ Frontend dependencies installed"
echo ""

# Create .env file if it doesn't exist
cd ../backend
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created (you can customize it later)"
else
    echo "ℹ️  .env file already exists"
fi
echo ""

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build
echo "✅ TypeScript build complete"
echo ""

cd ..
echo "✅ Setup complete!"
echo ""
echo "🚀 To start the application:"
echo ""
echo "   Terminal 1 (Backend):"
echo "   cd backend && npm run dev"
echo ""
echo "   Terminal 2 (Frontend):"
echo "   cd frontend && npm run dev"
echo ""
echo "   Then open: http://localhost:5173"
echo ""
echo "📖 For more information, see README.md"