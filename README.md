<div align="center">

# AUTO\MATE 🦦

**Your cozy developer companion for post-release maintenance, feedback, and fixes.**

Turn scattered bug reports into tested, ready-to-review pull requests.

[![Status](https://img.shields.io/badge/status-beta-blue?style=for-the-badge)](https://github.com/OpenHands/incubator-program)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](./LICENSE)

[Quickstart](#quickstart) • [What it does](#what-it-does) • [Integrations](#integrations) • [Self-hosting](./docs/SELF_HOSTING.md) • [Docs](./docs/README.md)

</div>

---

## The problem

When a feature breaks post-release, the true cost isn't just developer time — it's brand equity, user churn, and store ratings crashing in real time.

The report lands in a Slack thread, a support ticket, an App Store review, or an angry post on X. Someone has to notice it, judge whether it matters, reproduce it, find the cause, and fix it. Most of that work is not engineering. It's triage.

AUTO\MATE is a self-hosted agent that owns the loop between "a user reported something" and "here's a PR."

---

## What it does

Four things, in order:

### 1. The Black Hole → curated, prioritized issues

Reports arrive from everywhere and go nowhere. AUTO\MATE ingests feedback from Slack, X, GitHub, Bitbucket, Jira, and Linear, deduplicates it, clusters related reports, and ranks by real signal — how many users are hitting it, how severe the failure is, and what it touches in your codebase.

### 2. Moment of Failure → automatic reproduction

The agent recreates the exact conditions behind a reported failure in a sandbox — the environment, the inputs, the sequence of steps — eliminating hours of manual reproduction and back-and-forth with the reporter.

### 3. Root Cause Analysis → an actual explanation

Once the failure reproduces, the agent traces it through the codebase, execution flow, logs, and recent changes to identify what actually caused it. Not a stack trace. A cause.

### 4. Quick Fix → a pull request you can review

The agent implements the fix, runs your test suite to validate it, and raises a PR for a human to review and approve. You stay the approver. The agent does the legwork.

> Developers don't spend hours curating and recreating bugs or deciding what to ship next. They receive a tested, ready-to-review production solution.

---

## Integrations

**Intake** — Slack, X, GitHub Issues, Bitbucket, Jira, Linear, app store reviews, webhooks

**Output** — GitHub / Bitbucket pull requests, Slack digests, Jira / Linear ticket updates

Anything with a webhook can feed the queue. Anything with an API can receive the result.

---

## Features

| | |
|---|---|
| **Autonomous agent reasoning** | Plans and executes multi-step investigations without hand-holding |
| **Codebase understanding** | Reads and reasons over your repository, not just the diff |
| **Autonomous code editing** | Writes and revises real changes, then validates them |
| **Sandboxed execution** | Every reproduction and fix runs in an isolated environment |
| **Computer & terminal interaction** | Full shell access inside the sandbox |
| **Browser interaction** | Reproduces UI bugs by actually driving the browser |
| **Persistent memory** | Remembers past incidents, fixes, and codebase context across runs |
| **Context management** | Handles large repositories without drowning in tokens |
| **Specialized sub-agents** | Delegates triage, reproduction, RCA, and fixing to focused agents |
| **Parallel tool execution** | Investigates multiple hypotheses at once |
| **Security & action validation** | Guardrails on what the agent is allowed to touch |
| **MCP integration** | Connect any Model Context Protocol server |
| **Custom tools & skills** | Teach the agent your internal tooling and conventions |
| **Model agnostic** | Bring your own LLM |
| **Docker / Kubernetes support** | Run it where your infrastructure already lives |
| **Cloud deployment** | Always-on agents that don't stop when your laptop closes |

---

## Quickstart

You can run AUTO\MATE on any machine: your laptop, a dedicated box like a Mac Mini, or a server in the cloud.

Running it on a server is the most useful setup — agents keep working when your laptop is shut, and webhooks from Slack, GitHub, and your monitoring stack can reach it. See [SELF_HOSTING.md](./docs/SELF_HOSTING.md), especially the security hardening section.

### Option 1 — Docker (recommended)

**Prerequisites:** Docker Desktop (macOS/Windows) or Docker Engine (Linux), and a host directory containing the projects you want the agent to access.

```bash
export PROJECTS_PATH="$HOME/projects"   # directory containing your project folders
mkdir -p "$PROJECTS_PATH" "$HOME/.automate"

docker run -it --rm \
  -p 8000:8000 \
  -v "$HOME/.automate:/home/automate/.automate" \
  -v "${PROJECTS_PATH}:/projects" \
  ghcr.io/automate/automate:latest
```

The agent can access any project under `PROJECTS_PATH`. On Windows, see [README.windows.md](./README.windows.md).

### Option 2 — npm (no sandbox)

> [!WARNING]
> This runs the agent server directly on your machine — the agent will have full access to your filesystem.

**Prerequisites:** Node.js 22.12.x or later, `uv`

```bash
npm install -g @automate/cli
automate
```

The `automate` command starts the full local stack. You can split it when you want to run pieces separately:

```bash
automate --frontend-only   # static frontend + ingress only
automate --backend-only    # agent server + automation backend + ingress only
```

### Option 3 — from source

**Prerequisites:** Node.js 22.12.x or later, `npm`, `uv`

```bash
git clone https://github.com/your-org/automate.git
cd automate
npm install
npm run dev
```

Then open **http://localhost:8000** (or `http://localhost:8000/automate` for the Docker image).

### First run

1. Connect a model provider in **Settings → Model** (any LLM works).
2. Connect at least one intake source — Slack or GitHub is the fastest start.
3. Point AUTO\MATE at a repository.
4. Let a report come in, or replay an existing issue to watch the full loop.

---

## Architecture

AUTO\MATE is built on the OpenHands Agent Server — a REST API for running multiple agents on a single machine. Each Agent Server runs on a single host/port, and the AUTO\MATE control center can connect to several at once and switch between them without losing focus.

```
  Slack · X · GitHub · Bitbucket · Jira · Linear · webhooks
                        │
                        ▼
               ┌─────────────────┐
               │  Intake & Triage│   dedupe, cluster, prioritize
               └────────┬────────┘
                        ▼
               ┌─────────────────┐
               │ Automation Server│  schedules, events, dispatch
               └────────┬────────┘
                        ▼
               ┌─────────────────┐
               │  Agent Server   │   reproduce → RCA → fix → test
               │   (sandboxed)   │
               └────────┬────────┘
                        ▼
                  Pull Request
```

You can run an Agent Server anywhere: directly on your laptop (be careful), on a dedicated machine, on a VM in the cloud, or inside your own company infrastructure. Share one server with your team for maintenance agents, and keep a separate personal one running locally.

The **Automation Server** decides *when* work runs. The **Agent Server** decides *what* runs.

---

## Configuration

Configuration lives in `~/.automate/config.toml` (or via environment variables). Minimum viable config:

```toml
[model]
provider = "anthropic"        # or openai, google, bedrock, ollama, ...
name = "claude-sonnet-4-6"

[sandbox]
type = "docker"
timeout = 900

[intake.github]
enabled = true
repos = ["your-org/your-repo"]

[intake.slack]
enabled = true
channels = ["#bugs", "#support"]

[fix]
run_tests = true
auto_open_pr = true           # set false to require manual dispatch
```

See the [configuration guide](./docs/README.md) for the full reference.

---

## Documentation

- [Documentation index](./docs/README.md)
- [Architecture overview](./docs/architecture.md)
- [Self-hosting guide](./docs/SELF_HOSTING.md)
- [Development guide](./docs/DEVELOPMENT.md)
- [Contributing](./CONTRIBUTING.md)

---

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the development setup and code review guide.

---

## Acknowledgements

AUTO\MATE is built on [OpenHands](https://github.com/OpenHands/OpenHands) and the [OpenHands software-agent-sdk](https://github.com/OpenHands/software-agent-sdk). It works with any ACP-compatible agent, including OpenHands, Claude Code, Codex, and Gemini.

---

## License

MIT — see [LICENSE](./LICENSE).
