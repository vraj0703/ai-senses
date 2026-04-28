const { describe, it } = require("node:test");
const assert = require("node:assert");
const { evaluateOutcome } = require("./observe_outcome");

describe("observe_outcome — evaluateOutcome", () => {
  it("returns quality 1.0 for success", () => {
    const r = evaluateOutcome({ success: true });
    assert.strictEqual(r.quality, 1.0);
    assert.strictEqual(r.shouldReinforce, true);
    assert.strictEqual(r.shouldWeaken, false);
  });

  it("returns quality 0.3 for partial (process up but port not bound)", () => {
    const r = evaluateOutcome({ success: false, diagnostic: { processRunning: true, portBound: false } });
    assert.strictEqual(r.quality, 0.3);
    assert.strictEqual(r.shouldReinforce, false);
    assert.strictEqual(r.shouldWeaken, false);
  });

  it("returns quality 0.0 for total failure", () => {
    const r = evaluateOutcome({ success: false, diagnostic: { processRunning: false, portBound: false } });
    assert.strictEqual(r.quality, 0.0);
    assert.strictEqual(r.shouldReinforce, false);
    assert.strictEqual(r.shouldWeaken, true);
  });

  it("handles missing diagnostic gracefully", () => {
    const r = evaluateOutcome({ success: false });
    assert.strictEqual(r.quality, 0.0);
    assert.strictEqual(r.shouldWeaken, true);
  });
});
