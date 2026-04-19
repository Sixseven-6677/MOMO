#!/bin/bash

cd "$(dirname "$0")"
echo "Working dir: $(pwd)"

if [ ! -z "$APPSTATE" ]; then
  echo "$APPSTATE" > appstate.json
  echo "✓ appstate.json created"
fi

if [ ! -z "$CONFIG" ]; then
  echo "$CONFIG" > config.json
  echo "✓ config.json created"
fi

echo "Installing root dependencies..."
npm install --no-package-lock --silent

echo "Installing lib/fca-auto dependencies..."
cd lib/fca-auto && npm install --no-package-lock --silent && cd ../..

echo "Starting bot..."
node index.js
