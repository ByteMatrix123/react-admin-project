# Makefile for Enterprise Admin Backend

.PHONY: help install dev-install lint format check test clean pre-commit

# Default target
help:
	@echo "Available commands:"
	@echo "  install      - Install production dependencies"
	@echo "  dev-install  - Install development dependencies"
	@echo "  lint         - Run linting with Ruff"
	@echo "  format       - Format code with Ruff"
	@echo "  check        - Run all checks (lint, format, type check)"
	@echo "  test         - Run tests"
	@echo "  clean        - Clean cache and temporary files"
	@echo "  pre-commit   - Install and run pre-commit hooks"
	@echo "  security     - Run security checks with Bandit"

# Install dependencies
install:
	uv sync

# Install development dependencies
dev-install:
	uv sync --extra dev

# Run linting
lint:
	uv run ruff check .

# Format code
format:
	uv run ruff format .

# Fix linting issues
lint-fix:
	uv run ruff check . --fix

# Run type checking
type-check:
	uv run mypy app/

# Run all checks
check: lint type-check
	@echo "All checks passed!"

# Run tests
test:
	uv run pytest

# Run specific test modules
test-simple:
	uv run pytest tests/test_simple.py -v

test-auth:
	uv run pytest tests/test_auth.py -v

test-users:
	uv run pytest tests/test_users.py -v

test-roles:
	uv run pytest tests/test_roles.py -v

test-permissions:
	uv run pytest tests/test_permissions.py -v

test-integration:
	uv run pytest tests/test_integration.py -v

# Run tests with coverage
test-cov:
	uv run pytest --cov=app --cov-report=html --cov-report=term

# Run test runner script
test-runner:
	python scripts/run_tests.py

# Security checks
security:
	uv run bandit -r app/ -f json -o bandit-report.json
	uv run bandit -r app/

# Clean cache and temporary files
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.pyd" -delete
	find . -type f -name ".coverage" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +
	find . -type d -name ".ruff_cache" -exec rm -rf {} +
	rm -rf htmlcov/
	rm -rf dist/
	rm -rf build/

# Install pre-commit hooks
pre-commit-install:
	uv run pre-commit install

# Run pre-commit on all files
pre-commit:
	uv run pre-commit run --all-files

# Database migrations
migrate:
	uv run alembic upgrade head

# Create new migration
migration:
	uv run alembic revision --autogenerate -m "$(msg)"

# Start development server
dev:
	uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Start production server
start:
	uv run uvicorn main:app --host 0.0.0.0 --port 8000

# Docker commands
docker-build:
	docker build -t enterprise-admin-backend .

docker-run:
	docker run -p 8000:8000 enterprise-admin-backend

# Full development setup
setup: dev-install pre-commit-install
	@echo "Development environment setup complete!" 
