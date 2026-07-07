#!/bin/bash
echo "Testing build components..."
npx next build --no-lint 2>&1 | head -200
