const { describe, it } = require("node:test");
const assert = require("node:assert");
const { inferCause } = require("./diagnose_service");
const { DiagnosticReport } = require("../entities/diagnostic_report");

describe("diagnose_service — inferCause", () => {
  it("identifies process not running", () => {
    const r = inferCause(new DiagnosticReport({ serviceName: "wa", port: 3478, processRunning: false, portBound: false }));
    assert.strictEqual(r.cause, "process_not_running");
    assert.ok(r.suggestion.includes("Restart"));
  });

  it("identifies port conflict", () => {
    const r = inferCause(new DiagnosticReport({ serviceName: "wa", port: 3478, processRunning: false, portBound: true }));
    assert.strictEqual(r.cause, "port_conflict");
    assert.ok(r.suggestion.includes("conflicting"));
  });

  it("identifies stuck process", () => {
    const r = inferCause(new DiagnosticReport({ serviceName: "wa", port: 3478, processRunning: true, portBound: false }));
    assert.strictEqual(r.cause, "process_not_listening");
  });

  it("identifies internal error", () => {
    const r = inferCause(new DiagnosticReport({ serviceName: "wa", port: 3478, processRunning: true, portBound: true, httpStatus: 500 }));
    assert.strictEqual(r.cause, "internal_error");
    assert.ok(r.suggestion.includes("500"));
  });

  it("identifies connection refused with error", () => {
    const r = inferCause(new DiagnosticReport({ serviceName: "wa", port: 3478, processRunning: true, portBound: true, lastError: "ECONNREFUSED" }));
    assert.strictEqual(r.cause, "connection_refused");
  });

  it("returns unknown for undiagnosable case", () => {
    const r = inferCause(new DiagnosticReport({ serviceName: "wa", port: 3478, processRunning: true, portBound: true }));
    assert.strictEqual(r.cause, "unknown");
  });
});
