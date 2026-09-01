#!/usr/bin/env bash
# Start AUTO/MATE on Replit.
#
# Delegates to bin/agent-canvas.mjs, which starts the agent-server and the
# automation backend via uvx and serves the prebuilt SPA behind one ingress
# port. Replit exposes that port (8000) as the repl's public URL.
set -euo pipefail

cd "$(dirname "$0")/.."

PORT="${PORT:-8000}"

# --- Auth -------------------------------------------------------------------
# A repl URL is public. The agent server executes arbitrary shell commands, so
# it must never be reachable without a key. --public keeps the key OUT of the
# frontend bundle: whoever opens the UI has to paste it.
if [ -z "${LOCAL_BACKEND_API_KEY:-}" ]; then
  cat >&2 <<'MSG'
ERROR: LOCAL_BACKEND_API_KEY is not set.

This repl is publicly reachable and the agent server can run shell commands,
so an API key is required. Add it in the Replit sidebar under "Secrets":

  LOCAL_BACKEND_API_KEY = <a long random string>
  OH_SECRET_KEY         = <a second long random string>

Generate them locally with:  openssl rand -hex 32
MSG
  exit 1
fi

if [ -z "${OH_SECRET_KEY:-}" ]; then
  echo "WARN: OH_SECRET_KEY is unset - stored settings/secrets will not survive a rebuild." >&2
fi

# --- Same-origin CORS for the repl domain ------------------------------------
# Everything is proxied through the ingress, so the browser origin is the repl
# domain. Tell the automation backend to accept it.
if [ -z "${AUTOMATION_CORS_ORIGINS:-}" ]; then
  ORIGINS=""
  [ -n "${REPLIT_DEV_DOMAIN:-}" ] && ORIGINS="https://${REPLIT_DEV_DOMAIN}"
  for d in ${REPLIT_DOMAINS:-}; do
    [ -n "$ORIGINS" ] && ORIGINS="${ORIGINS},"
    ORIGINS="${ORIGINS}https://${d}"
  done
  if [ -n "$ORIGINS" ]; then
    export AUTOMATION_CORS_ORIGINS="$ORIGINS"
    echo "==> AUTOMATION_CORS_ORIGINS=$AUTOMATION_CORS_ORIGINS"
  fi
fi

# --- State on the persistent disk --------------------------------------------
export OH_CANVAS_SAFE_STATE_DIR="${OH_CANVAS_SAFE_STATE_DIR:-/home/runner/.openhands/agent-canvas}"
mkdir -p "$OH_CANVAS_SAFE_STATE_DIR"

# The SPA build must already exist (scripts/replit-build.sh makes it).
if [ ! -d build ]; then
  echo "==> build/ missing, building now"
  npm run build:app
fi

echo "==> Starting AUTO/MATE on port ${PORT} (public mode)"
exec node bin/agent-canvas.mjs --port "$PORT" --public
