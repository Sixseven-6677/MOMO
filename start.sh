#!/bin/bash

echo "Checking environment..."

if [ ! -z "$APPSTATE" ]; then
  echo "$APPSTATE" > appstate.json
  echo "✓ appstate.json created"
fi

if [ ! -z "$CONFIG" ]; then
  echo "$CONFIG" > config.json
  echo "✓ config.json created"
fi

echo "Installing dependencies..."
npm install --no-package-lock --silent 2>&1 | tail -5

echo "Starting bot..."
node index.js
