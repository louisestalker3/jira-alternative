#!/bin/bash
set -e

echo "⏳ Waiting for database..."
sleep 2

echo "🔄 Running database migrations..."
alembic upgrade head

echo "🚀 Starting API server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
