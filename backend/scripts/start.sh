#!/bin/bash

# Enterprise Admin System Backend Startup Script

echo "🚀 Starting Enterprise Admin System Backend..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please update the .env file with your configuration"
fi

# Install dependencies if needed
if [ ! -d ".venv" ]; then
    echo "📦 Installing dependencies..."
    python -m venv .venv
    source .venv/bin/activate
    pip install uv
    uv pip install -e .[dev]
else
    echo "📦 Activating virtual environment..."
    source .venv/bin/activate
fi

# Run database migrations
echo "🗄️  Running database migrations..."
alembic upgrade head

# Initialize database with default data
echo "🌱 Initializing database..."
python scripts/init_db.py

# Start the application
echo "🎯 Starting FastAPI application..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload 
