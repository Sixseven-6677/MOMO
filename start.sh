#!/bin/bash

# Create appstate.json from environment variable if it exists
if [ ! -z "$APPSTATE" ]; then
  echo "$APPSTATE" > appstate.json
  echo "✓ appstate.json created from environment variable"
fi

# Create config.json from environment variable if it exists
if [ ! -z "$CONFIG" ]; then
  echo "$CONFIG" > config.json
  echo "✓ config.json created from environment variable"
fi

# Start the bot
node index.js
