# @vraj0703/ai-senses

> Infrastructure-perception layer for AI agents. Polls WhatsApp / cron / mobile, diagnoses services, emits sense events to the agent's mind. Mockable defaults — runs without any external service.

[![CI](https://github.com/vraj0703/ai-senses/actions/workflows/ci.yml/badge.svg)](https://github.com/vraj0703/ai-senses/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node: 18+](https://img.shields.io/badge/Node-18+-green.svg)](package.json)

The "senses" of an AI agent — the layer that asks "what's going on out there" and emits structured signals to the cognitive layer. Polls WhatsApp messages, cron schedules, mobile-device state. Diagnoses services that aren't responding (process inspection, port checks, container introspection). Observes whether the agent's restart decisions actually worked.

> **Status:** v0.1.0. Lifted from raj-sadan with mock-default DI so it runs `clone + npm install + npm start` without any service plugged in. Set `SENSES_USE_REAL=all` to switch to live integrations.

## What it does

| Capability | Sources |
|---|---|
| **Signal polling** | WhatsApp groups, cron schedules, mobile-device state |
| **Service diagnosis** | Port listening, process inspection, Docker container state via Portainer |
| **Outcome observation** | Re-checks a service 30s after the agent decided to restart it |
| **Mind emission** | Pushes structured sense events to a mind gateway |

Five domain interfaces: `i_signal_source`, `i_whatsapp_client`, `i_mobile_agent_client`, `i_infrastructure_client`, `i_diagnostic`, `i_event_store`, `i_mind_gateway`. Each ships a default stub.

## Install

```bash
npm install @vraj0703/ai-senses
```

## Use

### Standalone HTTP perception loop

```bash
ai-senses serve                    # starts on port 3487 with mocks
ai-senses --version
ai-senses --help

# diagnose a service
ai-senses diagnose mind 3486
```

### From code

```js
const { createContainer } = require("@vraj0703/ai-senses/container");

// Default — every integration is mocked
const c = createContainer();
const status = await c.mobileClient.getStatus();
// → { battery: 73, mock: true, ... }

// Swap to real WhatsApp + mobile, keep the rest mocked
const real = createContainer({ useReal: "whatsapp,mobile" });
```

### Switch to real integrations

Comma-separated subset, or `all`:

```bash
SENSES_USE_REAL=all ai-senses serve
SENSES_USE_REAL=whatsapp,mobile ai-senses serve
```

Known keys: `whatsapp`, `mobile`, `infrastructure`, `mind`, `diagnostic`, `events`, `signals`.

## Mockability contract

Every external integration ships with a stub. The contract:

- `clone + npm install + npm start` works in 10 seconds with no env vars set.
- Stubs return `[mock]`-tagged synthetic payloads — clearly distinguishable from real responses.
- Switching to real is one env var (`SENSES_USE_REAL`) — no code changes.

This is what RAJ-103 calls the "no hardware plugged in" promise. Every test in `tests/smoke.test.js` runs in <200 ms because nothing touches the network.

## Configuration

All knobs honor env vars (defaults shown):

| Var | Default | Purpose |
|---|---|---|
| `SENSES_PORT` | 3487 | HTTP port |
| `SENSES_USE_REAL` | (empty) | Comma-separated integrations to switch from mock to real, or `all` |
| `SENSES_WHATSAPP_HOST` | `http://127.0.0.1:3478` | WhatsApp gateway |
| `SENSES_MOBILE_AGENT_HOST` | `http://100.68.56.4:3490` | Mobile agent on the phone |
| `SENSES_PORTAINER_URL` | `http://100.108.180.118:9000` | Docker management |
| `SENSES_MIND_CHAT_URL` | `http://127.0.0.1:3486/chat` | Mind organ chat endpoint |
| `SENSES_MIND_HEALTH_URL` | `http://127.0.0.1:3486/health` | Mind organ health endpoint |
| `SENSES_WHATSAPP_POLL_MS` | 5000 | Signal polling interval |
| `SENSES_MOBILE_POLL_MS` | 60000 | Mobile state polling interval |
| `SENSES_MOBILE_BATTERY_LOW` | 15 | Battery low threshold (%) |
| `SENSES_MOBILE_BATTERY_CRITICAL` | 5 | Battery critical threshold (%) |
| `PORTAINER_TOKEN` | — | API token for the Portainer integration |

## Architecture

Clean architecture, mirrored from raj-sadan's v2 senses organ:

```
src/
├── domain/                Pure business logic — no I/O
│   ├── entities/          DiagnosticReport, MobileDeviceState, Signal, SenseEvent
│   ├── repositories/      7 interfaces (i_*)
│   ├── use_cases/         7 use cases (diagnose, observe_outcome, etc.)
│   ├── exceptions/
│   └── constants/         Defaults with env-var fallback
├── data/
│   ├── data_sources/      WhatsApp, Portainer, Mobile, Cron clients
│   ├── repositories/      Real implementations + mocks/
│   └── platform_bindings/
├── di/container.js        Mock-default + SENSES_USE_REAL swap
├── presentation/          HTTP server + polling controller
└── navigation/            Express routes
```

## What's not here yet

- **Camera / mic capture** — the original senses organ in raj-sadan didn't include hardware capture; that lives outside this scope. A future v0.2 may absorb webcam + mic if there's demand.
- **MCP server surface** — RAJ-108 (planned for follow-up). For v0.1.0 you wire ai-senses into your agent runner via the JS API or HTTP.
- **Comprehensive integration tests** — current state is unit tests + mock smoke tests. Live integration tests against real WhatsApp/Portainer/mobile are left to the consumer.

## See also

- [ai-mind](https://github.com/vraj0703/ai-mind) — the cognitive layer ai-senses emits to
- [ai-constitution](https://github.com/vraj0703/ai-constitution) — the governance framework
- [ai-lib](https://github.com/vraj0703/ai-lib) — shared logger, retry, ollama utilities

## License

MIT.
