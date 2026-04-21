#!/bin/bash

node -e "
const fs = require('fs');
const path = require('path');

if (process.env.APPSTATE) {
  fs.writeFileSync('appstate.json', process.env.APPSTATE, 'utf8');
  console.log('✓ appstate.json created');
}

if (process.env.CONFIG) {
  fs.writeFileSync('config.json', process.env.CONFIG, 'utf8');
  console.log('✓ config.json created');
}

const cacheDir = 'modules/commands/cache';
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
  console.log('✓ cache directory created');
}

const dataPath = path.join(cacheDir, 'data.json');
if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(dataPath, JSON.stringify({adminbox:{}}), 'utf8');
  console.log('✓ cache/data.json created');
}

const dataDir = path.join(cacheDir, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✓ cache/data directory created');
}

const disabledPath = path.join(cacheDir, 'disabled_threads.json');
if (!fs.existsSync(disabledPath)) {
  fs.writeFileSync(disabledPath, JSON.stringify([]), 'utf8');
  console.log('✓ cache/disabled_threads.json created');
}
"

echo "Starting bot..."
node index.js
