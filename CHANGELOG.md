# Changelog

## [Unreleased]

## [0.1.0] — 2026-04-28

First public release. Lifted from raj-sadan's v2 senses organ.

### Added

- **Clean architecture lift** — domain (entities, interfaces, use cases, exceptions, constants), data (sources, repositories, platform bindings), di, navigation, presentation. 40 JS files. 7 domain interfaces, 7 use cases.
- **Mock-default DI container** — every external integration ships with a stub:
  - `StubWhatsAppClient`, `StubMobileAgentClient`, `StubInfrastructureClient`, `StubMindGateway`, `StubDiagnostic`, `InMemoryEventStore`, `StubSignalSource`.
  - Stubs return `[mock]`-tagged synthetic payloads so consumers can run the perception loop without any service plugged in.
- **`SENSES_USE_REAL` swap** — comma-separated integrations to upgrade from mock to real, or `"all"` for everything. Per-integration switch.
- **Constants with env-var fallback** — every hard-coded raj-sadan-specific value (Pi at `100.108.180.118`, mobile at `100.68.56.4`, port `3487`) now honors a `SENSES_*` env var. raj-sadan still works because the defaults are unchanged.
- **CLI dispatcher** at `bin/ai-senses` — `serve`, `diagnose`, `capture`, `--version`, `--help`.
- **CI matrix** on Node 18 / 20 / 22.
- **57 tests pass** — 11 smoke (DI container, mock behaviors, swap mechanics) + 46 lifted from the original use-case tests (diagnose_service, observe_outcome, receive_signal, gateways, mobile).

### Known limitations

- **MCP server surface deferred** — RAJ-108 plans an MCP wrapper exposing 4 senses tools (capture, mic, mobile_status, inbox). v0.1.0 ships the HTTP server only. Consumers wire into agent runners via the JS API for now.
- **No camera / mic capture** — the original raj-sadan senses organ focuses on infrastructure perception (process state, mobile state, WhatsApp). Hardware capture is out of v0.1.0 scope.
- **Live integration tests** — only mocks are tested. Real WhatsApp / Portainer / mobile require a running service and are left to the consumer.
