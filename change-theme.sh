#!/usr/bin/env bash

set -e

PROJECT="$HOME/NSSCP"
CSS="$PROJECT/app/globals.css"

if [ ! -f "$CSS" ]; then
    echo "❌ app/globals.css not found."
    exit 1
fi

echo "========================================"
echo " NSSCP Theme Updater"
echo "========================================"

cp "$CSS" "$CSS.bak.$(date +%F-%H%M%S)"

echo "✓ Backup created"

echo "Updating Primary colors..."

sed -i \
-e 's/--primary: oklch([^;]*);/--primary: oklch(0.82 0.29 142);/g' \
-e 's/--accent: oklch([^;]*);/--accent: oklch(0.82 0.29 142);/g' \
-e 's/--sidebar-primary: oklch([^;]*);/--sidebar-primary: oklch(0.82 0.29 142);/g' \
-e 's/--sidebar-accent: oklch([^;]*);/--sidebar-accent: oklch(0.82 0.29 142);/g' \
-e 's/--chart-1: oklch([^;]*);/--chart-1: oklch(0.82 0.29 142);/g' \
-e 's/--chart-2: oklch([^;]*);/--chart-2: oklch(0.72 0.25 142);/g' \
-e 's/--chart-3: oklch([^;]*);/--chart-3: oklch(0.62 0.22 142);/g' \
-e 's/--chart-4: oklch([^;]*);/--chart-4: oklch(0.52 0.19 142);/g' \
-e 's/--chart-5: oklch([^;]*);/--chart-5: oklch(0.42 0.16 142);/g' \
"$CSS"

echo
echo "========================================"
echo "Current Theme Values"
echo "========================================"

grep -nE -- '--primary:|--accent:|--sidebar-primary:|--sidebar-accent:|--chart-[1-5]:' "$CSS"

echo
echo "Running Build..."
echo

cd "$PROJECT"

npm run build

echo
echo "========================================"
echo "✅ Theme updated successfully."
echo "========================================"
