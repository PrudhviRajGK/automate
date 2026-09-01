#!/usr/bin/env bash
# Build step for Replit deployments of AUTO/MATE.
#
# Produces the static SPA in build/ and warms the uvx cache so the first
# request after a deploy does not wait on a Python download.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Node $(node -v), npm $(npm -v)"

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
