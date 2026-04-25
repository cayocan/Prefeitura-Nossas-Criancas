#!/bin/sh
set -e

if [ "$NODE_ENV" = "production" ]; then
    echo "Starting in production mode..."
    exec node dist/server.js
fi

echo ""
echo "========================================"
echo "  Running tests before starting the server..."
echo "========================================"
echo ""

npm run test:ci

exec npm run dev
