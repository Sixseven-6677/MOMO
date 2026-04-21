#!/bin/bash

node -e "
const fs = require('fs');

if (process.env.APPSTATE) {
  fs.writeFileSync('appstate.json', process.env.APPSTATE, 'utf8');
  console.log('✓ appstate.json created');
}

if (process.env.CONFIG) {
  fs.writeFileSync('config.json', process.env.CONFIG, 'utf8');
  console.log('✓ config.json created');
}

const dataPath = 'modules/commands/cache/data.json';
if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(dataPath, JSON.stringify({adminbox:{},adminonly:{}}), 'utf8');
  console.log('✓ cache/data.json created');
}
"

echo "Installing fca-auto dependencies..."
cd lib/fca-auto && npm install --no-package-lock 2>/dev/null || true
cd /app

echo "Starting bot..."
node index.js
