# Enterprise Admin System - Makefile

.PHONY: help install dev build test clean docker-dev docker-prod

# Default target
help:
	@echo "Enterprise Admin System - Available Commands:"
	@echo ""
	@echo "Development:"
	@echo "  install     - Install all dependencies (frontend + backend)"
	@echo "  dev         - Start development servers"
	@echo "  dev-fe      - Start frontend development server"
	@echo "  dev-be      - Start backend development server"
	@echo "  dev-db      - Start database services only"
	@echo ""
	@echo "Build & Test:"
	@echo "  build       - Build frontend and backend"
	@echo "  build-fe    - Build frontend only"
	@echo "  test        - Run all tests"
	@echo "  test-fe     - Run frontend tests"
	@echo "  test-be     - Run backend tests"
	@echo "  lint        - Run linting for all projects"
	@echo "  lint-fe     - Run frontend linting"
	@echo "  lint-be     - Run backend linting"
	@echo ""
	@echo "Docker:"
	@echo "  docker-dev  - Start development environment with Docker"
	@echo "  docker-prod - Start production environment with Docker"
	@echo "  docker-down - Stop all Docker services"
	@echo ""
	@echo "Cleanup:"
	@echo "  clean       - Clean all build artifacts and dependencies"
	@echo "  clean-fe    - Clean frontend artifacts"
	@echo "  clean-be    - Clean backend artifacts"

# Installation
install: install-fe install-be
	@echo "✅ All dependencies installed"

install-fe:
	@echo "📦 Installing frontend dependencies..."
	cd frontend && npm install

install-be:
	@echo "📦 Installing backend dependencies..."
	cd backend && uv sync

# Development
dev: dev-db
	@echo "🚀 Starting development servers..."
	@echo "Frontend will be available at: http://localhost:5173"
	@echo "Backend will be available at: http://localhost:8000"
	@echo "API docs will be available at: http://localhost:8000/docs"
	@make -j2 dev-fe dev-be

dev-fe:
	@echo "🎨 Starting frontend development server..."
	cd frontend && npm run dev

dev-be:
	@echo "⚡ Starting backend development server..."
	cd backend && uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000

dev-db:
	@echo "🗄️ Starting database services..."
	docker-compose -f docker-compose.dev.yml up -d

# Build
build: build-fe build-be
	@echo "✅ Build completed"

build-fe:
	@echo "🏗️ Building frontend..."
	cd frontend && npm run build

build-be:
	@echo "🏗️ Building backend..."
	cd backend && uv build

# Testing
test: test-fe test-be
	@echo "✅ All tests completed"

test-fe:
	@echo "🧪 Running frontend tests..."
	cd frontend && npm run test

test-be:
	@echo "🧪 Running backend tests..."
	cd backend && uv run pytest

# Linting
lint: lint-fe lint-be
	@echo "✅ Linting completed"

lint-fe:
	@echo "🔍 Linting frontend..."
	cd frontend && npm run lint

lint-be:
	@echo "🔍 Linting backend..."
	cd backend && make lint

# Docker
docker-dev:
	@echo "🐳 Starting development environment with Docker..."
	docker-compose -f docker-compose.dev.yml up -d
	@echo "Database services started. Use 'make dev' to start application servers."

docker-prod:
	@echo "🐳 Starting production environment with Docker..."
	docker-compose up -d

docker-down:
	@echo "🛑 Stopping all Docker services..."
	docker-compose down
	docker-compose -f docker-compose.dev.yml down

# Cleanup
clean: clean-fe clean-be
	@echo "🧹 Cleanup completed"

clean-fe:
	@echo "🧹 Cleaning frontend..."
	cd frontend && rm -rf node_modules dist .vite

clean-be:
	@echo "🧹 Cleaning backend..."
	cd backend && rm -rf .venv __pycache__ .pytest_cache htmlcov .coverage

# Database operations
db-migrate:
	@echo "🗄️ Running database migrations..."
	cd backend && uv run alembic upgrade head

db-reset:
	@echo "🗄️ Resetting database..."
	cd backend && uv run alembic downgrade base && uv run alembic upgrade head

# Quick start for new developers
setup: install docker-dev db-migrate
	@echo "🎉 Setup completed! Run 'make dev' to start development."

# Status check
status:
	@echo "📊 System Status:"
	@echo "Frontend: $(shell cd frontend && npm list --depth=0 2>/dev/null | grep -c 'npm' || echo 'Not installed')"
	@echo "Backend: $(shell cd backend && uv run python --version 2>/dev/null || echo 'Not installed')"
	@echo "Docker: $(shell docker --version 2>/dev/null || echo 'Not installed')"
	@echo "Database: $(shell docker ps --filter name=postgres --format '{{.Status}}' 2>/dev/null || echo 'Not running')" 
