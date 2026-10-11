#!/bin/sh
set -e

echo "=========================================================="
echo " Starting GhatWatch AI Production Stack                   "
echo "=========================================================="

# Ensure CLIENT_ORIGIN is set if not provided by host environment
if [ -z "$CLIENT_ORIGIN" ]; then
  export CLIENT_ORIGIN="*"
  echo "Defaulting CLIENT_ORIGIN to: *"
fi

# 1. Start Python Risk Engine in the background
echo "[1/2] Launching internal Python Risk Engine on port 8000..."
python3 -m uvicorn api:app --app-dir engine --host 127.0.0.1 --port 8000 &
ENGINE_PID=$!

# Trap signals to ensure graceful shutdown of Python subprocess
cleanup() {
  echo "Received shutdown signal. Stopping services..."
  kill -TERM "$ENGINE_PID" 2>/dev/null || true
  exit 0
}
trap cleanup TERM INT

# Wait for Python engine healthcheck
echo "Waiting for Python Risk Engine to respond..."
READY=0
for i in $(seq 1 30); do
  if curl -s http://127.0.0.1:8000/api/v1/health > /dev/null 2>&1; then
    echo "✓ Python Risk Engine is healthy."
    READY=1
    break
  fi
  sleep 1
done

if [ "$READY" -ne 1 ]; then
  echo "Warning: Python Risk Engine did not respond within 30s. Proceeding with Node server..."
fi

# 2. Start Node.js Express server in the foreground
echo "[2/2] Launching Node.js Express API & Static SPA on port ${PORT:-5000}..."
exec node server/src/server.js
