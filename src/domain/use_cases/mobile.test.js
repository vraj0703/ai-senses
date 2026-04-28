const { describe, it } = require("node:test");
const assert = require("node:assert");
const { MobileDeviceState } = require("../entities/mobile_device_state");
const { pollMobileDevice, alertOnLowBattery } = require("./poll_mobile_device");

// ─── Mocks ───

class MockMobileClient {
  constructor({ reachable = true, snapshot = null } = {}) {
    this.reachable = reachable;
    this.snapshot = snapshot;
  }
  async isReachable() { return this.reachable; }
  async getSnapshot() { return this.snapshot; }
  async speak() { return true; }
  async vibrate() { return true; }
  async toast() { return true; }
}

function makeSnapshot(overrides = {}) {
  return new MobileDeviceState({
    timestamp: "2026-04-11T10:00:00.000Z",
    battery: { percent: 50, status: "discharging", temperature: 31 },
    wifi: { ssid: "home", ip: "192.168.1.10", rssi: -55 },
    location: { lat: 0, lng: 0, accuracy: 10 },
    locationContext: "home",
    uptime: 3600,
    ...overrides,
  });
}

// ─── Tests ───

describe("MobileDeviceState entity", () => {
  it("constructs and exposes fields; isLowBattery + isCharging work", () => {
    const lowDischarging = makeSnapshot({ battery: { percent: 10, status: "discharging" } });
    assert.strictEqual(lowDischarging.isLowBattery(), true);
    assert.strictEqual(lowDischarging.isLowBattery(5), false);
    assert.strictEqual(lowDischarging.isCharging(), false);

    const charging = makeSnapshot({ battery: { percent: 80, status: "Charging" } });
    assert.strictEqual(charging.isCharging(), true);
    assert.strictEqual(charging.isLowBattery(), false);

    assert.throws(() => new MobileDeviceState({}), /timestamp required/);
  });
});

describe("pollMobileDevice", () => {
  it("returns snapshot on happy path", async () => {
    const snap = makeSnapshot();
    const mobileClient = new MockMobileClient({ reachable: true, snapshot: snap });
    const result = await pollMobileDevice({ mobileClient });
    assert.strictEqual(result, snap);
  });

  it("returns null when unreachable", async () => {
    const mobileClient = new MockMobileClient({ reachable: false });
    const result = await pollMobileDevice({ mobileClient });
    assert.strictEqual(result, null);
  });

  it("returns null when mobileClient is null", async () => {
    const result = await pollMobileDevice({ mobileClient: null });
    assert.strictEqual(result, null);
  });
});

describe("alertOnLowBattery", () => {
  it("triggers when battery low and not charging", async () => {
    const snap = makeSnapshot({ battery: { percent: 8, status: "discharging" } });
    const mobileClient = new MockMobileClient({ reachable: true, snapshot: snap });
    const result = await alertOnLowBattery({ mobileClient });
    assert.strictEqual(result.triggered, true);
    assert.strictEqual(result.battery.percent, 8);
  });

  it("does not trigger when charging, even if low", async () => {
    const snap = makeSnapshot({ battery: { percent: 8, status: "charging" } });
    const mobileClient = new MockMobileClient({ reachable: true, snapshot: snap });
    const result = await alertOnLowBattery({ mobileClient });
    assert.strictEqual(result.triggered, false);
  });

  it("does not trigger when battery normal", async () => {
    const snap = makeSnapshot({ battery: { percent: 75, status: "discharging" } });
    const mobileClient = new MockMobileClient({ reachable: true, snapshot: snap });
    const result = await alertOnLowBattery({ mobileClient });
    assert.strictEqual(result.triggered, false);
  });

  it("returns triggered:false with reason when unreachable", async () => {
    const mobileClient = new MockMobileClient({ reachable: false });
    const result = await alertOnLowBattery({ mobileClient });
    assert.strictEqual(result.triggered, false);
    assert.match(result.reason, /unreachable/);
  });
});
