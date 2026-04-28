const { describe, it } = require("node:test");
const assert = require("node:assert");
const { receiveSignal } = require("./receive_signal");
const { Signal } = require("../entities/signal");

describe("receive_signal", () => {
  it("converts whatsapp signal to message event", () => {
    const sig = new Signal({ source: "whatsapp", data: { sender: "+91pm", message: "hello" } });
    const evt = receiveSignal(sig);
    assert.strictEqual(evt.type, "message");
    assert.strictEqual(evt.source, "whatsapp");
    assert.strictEqual(evt.sender, "+91pm");
    assert.strictEqual(evt.payload, "hello");
    assert.strictEqual(evt.signalId, sig.id);
  });

  it("converts cron success signal to job_result event", () => {
    const sig = new Signal({ source: "cron", data: { job_key: "heartbeat", success: true } });
    const evt = receiveSignal(sig);
    assert.strictEqual(evt.type, "job_result");
    assert.strictEqual(evt.payload.success, true);
    assert.strictEqual(evt.priority, "normal");
  });

  it("converts cron failure to urgent event", () => {
    const sig = new Signal({ source: "cron", data: { job_key: "heartbeat", success: false, failure_reason: "timeout" } });
    const evt = receiveSignal(sig);
    assert.strictEqual(evt.type, "job_result");
    assert.strictEqual(evt.priority, "urgent");
    assert.strictEqual(evt.payload.reason, "timeout");
  });

  it("converts mobile signal to heartbeat event", () => {
    const sig = new Signal({ source: "mobile", data: { battery: 85, connectivity: "wifi" } });
    const evt = receiveSignal(sig);
    assert.strictEqual(evt.type, "heartbeat");
    assert.strictEqual(evt.payload.battery, 85);
  });

  it("converts system signal preserving type", () => {
    const sig = new Signal({ source: "system", data: { type: "diagnostic", service: "whatsapp" } });
    const evt = receiveSignal(sig);
    assert.strictEqual(evt.type, "diagnostic");
    assert.strictEqual(evt.sender, "whatsapp");
  });

  it("toMindInput() produces valid Input shape", () => {
    const sig = new Signal({ source: "whatsapp", data: { sender: "+91pm", message: "test" } });
    const evt = receiveSignal(sig);
    const input = evt.toMindInput();
    assert.strictEqual(input.type, "message");
    assert.strictEqual(input.source, "whatsapp");
    assert.strictEqual(input.sender, "+91pm");
    assert.strictEqual(input.payload, "test");
  });

  it("maps health_check to health input type", () => {
    const sig = new Signal({ source: "system", data: { type: "health_check" } });
    const evt = receiveSignal(sig);
    const input = evt.toMindInput();
    assert.strictEqual(input.type, "health");
  });

  it("maps outcome to health input type", () => {
    const sig = new Signal({ source: "system", data: { type: "outcome", success: true } });
    const evt = receiveSignal(sig);
    const input = evt.toMindInput();
    assert.strictEqual(input.type, "health");
  });
});
