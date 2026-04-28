/**
 * HTTPMindGateway — pushes SenseEvents to mind v2 via HTTP POST.
 */
const { IMindGateway } = require("../../domain/repositories/i_mind_gateway");
const { MIND_GATEWAY_URL, MIND_HEALTH_URL } = require("../../domain/constants");

class HTTPMindGateway extends IMindGateway {
  constructor(opts = {}) {
    super();
    this.chatUrl = opts.chatUrl || MIND_GATEWAY_URL;
    this.healthUrl = opts.healthUrl || MIND_HEALTH_URL;
  }

  async isAvailable() {
    try {
      const res = await fetch(this.healthUrl, { signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch { return false; }
  }

  async emit(event) {
    const input = event.toMindInput();
    try {
      const res = await fetch(this.chatUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) return { accepted: false, error: `HTTP ${res.status}` };
      const data = await res.json();
      return { accepted: true, decisionId: data.decisionId };
    } catch (err) {
      return { accepted: false, error: err.message };
    }
  }
}

module.exports = { HTTPMindGateway };
