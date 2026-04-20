#!/bin/bash
  cd "$(dirname "$0")"
  [ ! -z "$APPSTATE" ] && echo "$APPSTATE" > appstate.json && echo "✓ appstate.json created"
  [ ! -z "$CONFIG" ] && echo "$CONFIG" > config.json && echo "✓ config.json created"
  mkdir -p modules/commands/cache
  [ ! -f modules/commands/cache/data.json ] && echo '{"adminbox":{}}' > modules/commands/cache/data.json && echo "✓ cache/data.json created"
  echo "Starting bot..."
  node index.js
  