#!/bin/sh
set -e

echo ""
echo "========================================"
echo "  Running tests before starting the server..."
echo "========================================"
echo ""

npm run test:ci

exec npm run dev
