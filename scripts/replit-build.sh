#!/usr/bin/env bash
# Build step for Replit deployments of AUTO/MATE.
#
# Produces the static SPA in build/ and warms the uvx cache so the first
# request after a deploy does not wait on a Python download.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Node $(node -v), npm $(npm -v)"

# uv/uvx drives the Python backends. replit.nix provides pkgs.uv; if the
# channel does not expose it, fall back to pip so the deploy still works.
if ! command -v uvx >/dev/null 2>&1; then
  echo "==> uvx not on PATH, installing uv via pip"
  python3 -m pip install --user --upgrade uv || pip install --user --upgrade uv
  export PATH="$HOME/.local/bin:$PATH"
fi
command -v uvx >/dev/null 2>&1 && echo "==> uvx: $(command -v uvx)" || echo "WARN: uvx still missing"

echo "==> Installing JS dependencies"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "==> Building the SPA"
npm run build:app

if [ ! -d build ]; then
  echo "ERROR: expected build/ to exist after 'npm run build:app'" >&2
  exit 1
fi

echo "==> Warming the uvx cache for the Python backends"
# Non-fatal: if this fails the launcher will fetch at first boot instead.
AGENT_SERVER_VERSION="$(node -p "require('./config/defaults.json').versions.agentServer")"
AUTOMATION_VERSION="$(node -p "require('./config/defaults.json').versions.automation")"
uvx --from "openhands-agent-server==${AGENT_SERVER_VERSION}" python -c "pass" || \
  echo "WARN: could not pre-warm agent-server ${AGENT_SERVER_VERSION}"
uvx --from "openhands-automation==${AUTOMATION_VERSION}" python -c "pass" || \
  echo "WARN: could not pre-warm automation ${AUTOMATION_VERSION}"

echo "==> Build complete"
