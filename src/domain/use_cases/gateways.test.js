const { describe, it } = require("node:test");
const assert = require("node:assert");

const {
  sendWhatsAppMessage,
  sendWhatsAppGroup,
  getWhatsAppHealth,
} = require("./whatsapp_operations");

const {
  checkInfrastructureHealth,
  listPiContainers,
  restartPiContainer,
} = require("./monitor_infrastructure");

const { IWhatsAppClient } = require("../repositories/i_whatsapp_client");
const { IInfrastructureClient } = require("../repositories/i_infrastructure_client");

// ─── Mocks ──────────────────────────────────────────────────────────────────

function makeMockWhatsApp({ directOk = true, groupOk = true, healthData = { status: "connected" } } = {}) {
  const calls = { health: 0, sendDirect: [], sendGroup: [], getIncoming: 0 };
  class Mock extends IWhatsAppClient {
    async health() { calls.health++; return healthData; }
    async sendDirect(to, message) { calls.sendDirect.push({ to, message }); return directOk; }
    async sendGroup(group, message) { calls.sendGroup.push({ group, message }); return groupOk; }
    async getIncoming() { calls.getIncoming++; return []; }
  }
  return { client: new Mock(), calls };
}

function makeMockInfra({ reachable = true, containers = [{ Id: "abc", Names: ["/nextcloud"] }], restartOk = true } = {}) {
  const calls = { health: 0, listContainers: 0, restartContainer: [], containerLogs: [] };
  class Mock extends IInfrastructureClient {
    async health() { calls.health++; return { reachable }; }
    async listContainers() { calls.listContainers++; return reachable ? containers : null; }
    async restartContainer(id) { calls.restartContainer.push(id); return restartOk; }
    async containerLogs(id, tail) { calls.containerLogs.push({ id, tail }); return "log line\n"; }
  }
  return { client: new Mock(), calls };
}

// ─── WhatsApp use cases ─────────────────────────────────────────────────────

describe("whatsapp_operations — sendWhatsAppMessage", () => {
  it("delegates to client.sendDirect and returns true", async () => {
    const { client, calls } = makeMockWhatsApp();
    const ok = await sendWhatsAppMessage({ whatsappClient: client, to: "91999", message: "hi" });
    assert.strictEqual(ok, true);
    assert.deepStrictEqual(calls.sendDirect, [{ to: "91999", message: "hi" }]);
  });

  it("returns false when client missing", async () => {
    const ok = await sendWhatsAppMessage({ whatsappClient: null, to: "91999", message: "hi" });
    assert.strictEqual(ok, false);
  });

  it("returns false when `to` missing", async () => {
    const { client } = makeMockWhatsApp();
    const ok = await sendWhatsAppMessage({ whatsappClient: client, to: "", message: "hi" });
    assert.strictEqual(ok, false);
  });

  it("returns false when `message` missing", async () => {
    const { client } = makeMockWhatsApp();
    const ok = await sendWhatsAppMessage({ whatsappClient: client, to: "91", message: "" });
    assert.strictEqual(ok, false);
  });

  it("propagates client false return", async () => {
    const { client } = makeMockWhatsApp({ directOk: false });
    const ok = await sendWhatsAppMessage({ whatsappClient: client, to: "91", message: "hi" });
    assert.strictEqual(ok, false);
  });
});

describe("whatsapp_operations — sendWhatsAppGroup", () => {
  it("accepts valid group and delegates", async () => {
    const { client, calls } = makeMockWhatsApp();
    const ok = await sendWhatsAppGroup({ whatsappClient: client, group: "alerts-reports", message: "boot" });
    assert.strictEqual(ok, true);
    assert.deepStrictEqual(calls.sendGroup, [{ group: "alerts-reports", message: "boot" }]);
  });

  it("rejects invalid group without calling client", async () => {
    const { client, calls } = makeMockWhatsApp();
    const ok = await sendWhatsAppGroup({ whatsappClient: client, group: "not-a-group", message: "x" });
    assert.strictEqual(ok, false);
    assert.strictEqual(calls.sendGroup.length, 0);
  });

  it("accepts all 8 canonical groups", async () => {
    const groups = [
      "general", "alerts-reports", "notes-journal", "planning",
      "design", "resources", "external-affairs", "review",
    ];
    for (const g of groups) {
      const { client } = makeMockWhatsApp();
      const ok = await sendWhatsAppGroup({ whatsappClient: client, group: g, message: "m" });
      assert.strictEqual(ok, true, `group ${g} should be accepted`);
    }
  });

  it("rejects empty message", async () => {
    const { client } = makeMockWhatsApp();
    const ok = await sendWhatsAppGroup({ whatsappClient: client, group: "general", message: "" });
    assert.strictEqual(ok, false);
  });
});

describe("whatsapp_operations — getWhatsAppHealth", () => {
  it("returns data from client", async () => {
    const { client } = makeMockWhatsApp({ healthData: { status: "connected", uptime: 42 } });
    const data = await getWhatsAppHealth({ whatsappClient: client });
    assert.strictEqual(data.status, "connected");
    assert.strictEqual(data.uptime, 42);
  });

  it("returns null when client missing", async () => {
    const data = await getWhatsAppHealth({ whatsappClient: null });
    assert.strictEqual(data, null);
  });
});

// ─── Infrastructure use cases ───────────────────────────────────────────────

describe("monitor_infrastructure — checkInfrastructureHealth", () => {
  it("returns reachable: true when client healthy", async () => {
    const { client } = makeMockInfra();
    const r = await checkInfrastructureHealth({ infraClient: client });
    assert.strictEqual(r.reachable, true);
  });

  it("returns reachable: false with error when no client", async () => {
    const r = await checkInfrastructureHealth({ infraClient: null });
    assert.strictEqual(r.reachable, false);
    assert.ok(r.error);
  });
});

describe("monitor_infrastructure — listPiContainers", () => {
  it("returns containers array from client", async () => {
    const { client } = makeMockInfra();
    const cs = await listPiContainers({ infraClient: client });
    assert.ok(Array.isArray(cs));
    assert.strictEqual(cs[0].Id, "abc");
  });

  it("returns null when client unavailable", async () => {
    const cs = await listPiContainers({ infraClient: null });
    assert.strictEqual(cs, null);
  });

  it("returns null when infra unreachable", async () => {
    const { client } = makeMockInfra({ reachable: false });
    const cs = await listPiContainers({ infraClient: client });
    assert.strictEqual(cs, null);
  });
});

describe("monitor_infrastructure — restartPiContainer", () => {
  it("delegates and returns true", async () => {
    const { client, calls } = makeMockInfra();
    const ok = await restartPiContainer({ infraClient: client, containerId: "abc" });
    assert.strictEqual(ok, true);
    assert.deepStrictEqual(calls.restartContainer, ["abc"]);
  });

  it("returns false when no containerId", async () => {
    const { client } = makeMockInfra();
    const ok = await restartPiContainer({ infraClient: client, containerId: "" });
    assert.strictEqual(ok, false);
  });

  it("returns false when no client", async () => {
    const ok = await restartPiContainer({ infraClient: null, containerId: "abc" });
    assert.strictEqual(ok, false);
  });

  it("propagates client failure", async () => {
    const { client } = makeMockInfra({ restartOk: false });
    const ok = await restartPiContainer({ infraClient: client, containerId: "abc" });
    assert.strictEqual(ok, false);
  });
});
