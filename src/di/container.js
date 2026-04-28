/**
 * di/container.js — Dependency-injection container.
 *
 * Mock-default: every external integration ships with a stub so the organ
 * runs `clone + npm install + npm start` without any service plugged in.
 *
 * To swap in real implementations, set the `SENSES_USE_REAL` environment
 * variable. Comma-separated subset (`whatsapp,mobile`) or `all` for
 * everything. Anything not listed stays mocked.
 *
 * Knobs accepted in `config`:
 *   projectRoot, port, useReal (overrides env), whatsappHost, portainerUrl,
 *   portainerToken, mobileAgentHost, mindChatUrl, mindHealthUrl.
 */

const path = require("path");

// Real implementations
const { WhatsAppSource } = require("../data/data_sources/remote/whatsapp_source");
const { HttpWhatsAppClient } = require("../data/data_sources/remote/http_whatsapp_client");
const { PortainerClient } = require("../data/data_sources/remote/portainer_client");
const { HttpMobileAgentClient } = require("../data/data_sources/remote/http_mobile_agent_client");
const { HTTPMindGateway } = require("../data/repositories/http_mind_gateway");
const { ProcessDiagnostic } = require("../data/repositories/process_diagnostic");
const { JSONLEventStore } = require("../data/repositories/jsonl_event_store");

// Mocks
const { StubWhatsAppClient } = require("../data/repositories/mocks/stub_whatsapp_client");
const { StubMobileAgentClient } = require("../data/repositories/mocks/stub_mobile_agent_client");
const { StubInfrastructureClient } = require("../data/repositories/mocks/stub_infrastructure_client");
const { StubMindGateway } = require("../data/repositories/mocks/stub_mind_gateway");
const { StubDiagnostic } = require("../data/repositories/mocks/stub_diagnostic");
const { InMemoryEventStore } = require("../data/repositories/mocks/in_memory_event_store");
const { StubSignalSource } = require("../data/repositories/mocks/stub_signal_source");

const {
  WHATSAPP_HOST,
  PORTAINER_URL,
  MOBILE_AGENT_HOST,
  MIND_GATEWAY_URL,
  MIND_HEALTH_URL,
} = require("../domain/constants");

const KNOWN_KEYS = ["whatsapp", "mobile", "infrastructure", "mind", "diagnostic", "events", "signals"];

function _parseUseReal(value) {
  if (!value) return new Set();
  if (typeof value === "string") {
    if (value.trim().toLowerCase() === "all") return new Set(KNOWN_KEYS);
    return new Set(value.split(",").map((s) => s.trim()).filter(Boolean));
  }
  if (Array.isArray(value)) return new Set(value);
  return new Set();
}

function createContainer(config = {}) {
  const projectRoot = config.projectRoot || process.cwd();
  const useReal = _parseUseReal(config.useReal ?? process.env.SENSES_USE_REAL);

  const _real = (key) => useReal.has(key);

  // Sources
  const whatsappHost = config.whatsappHost || WHATSAPP_HOST;
  const sources = _real("signals")
    ? [new WhatsAppSource({ host: whatsappHost })]
    : [new StubSignalSource()];

  // WhatsApp client
  const whatsappClient = _real("whatsapp")
    ? new HttpWhatsAppClient({ host: whatsappHost })
    : new StubWhatsAppClient();

  // Infrastructure (Portainer)
  const infraClient = _real("infrastructure")
    ? new PortainerClient({
        url: config.portainerUrl || PORTAINER_URL,
        token: config.portainerToken || process.env.PORTAINER_TOKEN,
      })
    : new StubInfrastructureClient();

  // Mobile agent
  const mobileClient = _real("mobile")
    ? new HttpMobileAgentClient({ host: config.mobileAgentHost || MOBILE_AGENT_HOST })
    : new StubMobileAgentClient();

  // Mind gateway
  const mindGateway = _real("mind")
    ? new HTTPMindGateway({
        chatUrl: config.mindChatUrl || MIND_GATEWAY_URL,
        healthUrl: config.mindHealthUrl || MIND_HEALTH_URL,
      })
    : new StubMindGateway();

  // Diagnostic
  const diagnostic = _real("diagnostic") ? new ProcessDiagnostic() : new StubDiagnostic();

  // Event store
  const eventStore = _real("events")
    ? new JSONLEventStore({
        filePath: config.eventLogPath || path.join(projectRoot, "nociception", "logs", "events.jsonl"),
      })
    : new InMemoryEventStore();

  return {
    sources,
    whatsappClient,
    infraClient,
    mobileClient,
    mindGateway,
    diagnostic,
    eventStore,
    config: {
      projectRoot,
      port: config.port,
      useReal: Array.from(useReal),
    },
  };
}

module.exports = { createContainer, KNOWN_KEYS };
