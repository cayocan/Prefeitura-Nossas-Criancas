#!/bin/sh
set -e

echo ""
echo "========================================="
echo "  Running tests before starting the server..."
echo "========================================="
echo ""

npm run test:ci

echo ""
echo "========================================="
echo "  Tests passed â€” starting server..."
echo "========================================="
echo ""

exec npm run dev
