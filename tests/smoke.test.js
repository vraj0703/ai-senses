/**
 * smoke.test.js — basic load + DI swap tests for ai-senses.
 *
 * The contract: clone + install + start runs with no hardware, no live
 * services, no env vars set. The container wires up mocks by default;
 * SENSES_USE_REAL swaps individual integrations to real.
 */

const test = require("node:test");
const assert = require("node:assert");

const { createContainer, KNOWN_KEYS } = require("../src/di/container.js");
const { StubWhatsAppClient } = require("../src/data/repositories/mocks/stub_whatsapp_client.js");
const { StubMobileAgentClient } = require("../src/data/repositories/mocks/stub_mobile_agent_client.js");
const { StubInfrastructureClient } = require("../src/data/repositories/mocks/stub_infrastructure_client.js");
const { StubMindGateway } = require("../src/data/repositories/mocks/stub_mind_gateway.js");
const { StubDiagnostic } = require("../src/data/repositories/mocks/stub_diagnostic.js");
const { InMemoryEventStore } = require("../src/data/repositories/mocks/in_memory_event_store.js");
const { StubSignalSource } = require("../src/data/repositories/mocks/stub_signal_source.js");

// ────────────────────────────────────────────────────────────
// Default container — every integration is mocked
// ────────────────────────────────────────────────────────────

test("default container wires up mocks for every integration", () => {
  const c = createContainer();
  assert.ok(c.whatsappClient instanceof StubWhatsAppClient);
  assert.ok(c.mobileClient instanceof StubMobileAgentClient);
  assert.ok(c.infraClient instanceof StubInfrastructureClient);
  assert.ok(c.mindGateway instanceof StubMindGateway);
  assert.ok(c.diagnostic instanceof StubDiagnostic);
  assert.ok(c.eventStore instanceof InMemoryEventStore);
  assert.ok(c.sources[0] instanceof StubSignalSource);
});

// ────────────────────────────────────────────────────────────
// Stub behavior — every mock returns sensible synthetic data
// ────────────────────────────────────────────────────────────

test("stub WhatsApp client returns mock messages", async () => {
  const client = new StubWhatsAppClient();
  const msgs = await client.fetchMessages({ group: "general" });
  assert.ok(msgs.length > 0);
  assert.ok(msgs[0].body.includes("[mock]"));
  assert.strictEqual(msgs[0].group, "general");
});

test("stub mobile client returns synthetic battery state", async () => {
  const client = new StubMobileAgentClient();
  const status = await client.getStatus();
  assert.strictEqual(typeof status.battery, "number");
  assert.strictEqual(status.mock, true);
});

test("stub mind gateway echoes [mock] response", async () => {
  const gw = new StubMindGateway();
  const r = await gw.chat({ message: "hello" });
  assert.ok(r.response.includes("[mock]"));
  assert.ok(r.response.includes("hello"));
  assert.strictEqual(r.mock, true);
});

test("stub diagnostic reports a port as listening", async () => {
  const d = new StubDiagnostic();
  const r = await d.checkPort(3487);
  assert.strictEqual(r.port, 3487);
  assert.strictEqual(r.listening, true);
  assert.strictEqual(r.mock, true);
});

test("in-memory event store appends + lists", async () => {
  const store = new InMemoryEventStore();
  await store.append({ kind: "test", data: 1 });
  await store.append({ kind: "test", data: 2 });
  const events = await store.list();
  assert.strictEqual(events.length, 2);
  assert.strictEqual(events[0].data, 1);
});

test("stub signal source yields mock signals on poll", async () => {
  const src = new StubSignalSource();
  const batch1 = await src.poll();
  const batch2 = await src.poll();
  assert.ok(batch1.length > 0);
  assert.ok(batch2.length > 0);
  assert.notStrictEqual(batch1[0].id, batch2[0].id);
});

// ────────────────────────────────────────────────────────────
// SENSES_USE_REAL swap behavior
// ────────────────────────────────────────────────────────────

test("SENSES_USE_REAL=whatsapp swaps only the WhatsApp client", () => {
  const c = createContainer({ useReal: "whatsapp" });
  assert.ok(!(c.whatsappClient instanceof StubWhatsAppClient));
  // Others stay mocked
  assert.ok(c.mobileClient instanceof StubMobileAgentClient);
  assert.ok(c.mindGateway instanceof StubMindGateway);
});

test("SENSES_USE_REAL=all swaps every integration to real", () => {
  const c = createContainer({ useReal: "all" });
  assert.ok(!(c.whatsappClient instanceof StubWhatsAppClient));
  assert.ok(!(c.mobileClient instanceof StubMobileAgentClient));
  assert.ok(!(c.infraClient instanceof StubInfrastructureClient));
  assert.ok(!(c.mindGateway instanceof StubMindGateway));
  assert.ok(!(c.diagnostic instanceof StubDiagnostic));
  assert.ok(!(c.eventStore instanceof InMemoryEventStore));
});

test("KNOWN_KEYS export documents the swap surface", () => {
  assert.ok(KNOWN_KEYS.includes("whatsapp"));
  assert.ok(KNOWN_KEYS.includes("mobile"));
  assert.ok(KNOWN_KEYS.includes("mind"));
  assert.strictEqual(KNOWN_KEYS.length, 7);
});

// ────────────────────────────────────────────────────────────
// Constants — defaults are sane
// ────────────────────────────────────────────────────────────

test("constants module loads with sane defaults", () => {
  const constants = require("../src/domain/constants/index.js");
  assert.strictEqual(constants.SENSES_PORT, 3487);
  assert.ok(constants.WHATSAPP_HOST.startsWith("http://"));
  assert.ok(Array.isArray(constants.WHATSAPP_GROUPS));
  assert.ok(constants.WHATSAPP_GROUPS.length > 0);
  // Env-var fallback path is exercised at module load — manual override not
  // re-tested here because module caching makes it unreliable in a single
  // test process. Manual: SENSES_PORT=9999 node -e 'console.log(require(".").SENSES_PORT)'.
});
