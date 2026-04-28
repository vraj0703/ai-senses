/**
 * StubMindGateway — default mock for HTTPMindGateway.
 *
 * Returns synthetic chat responses so ai-senses can run without an
 * actual mind service listening on 3486.
 */

class StubMindGateway {
  async chat({ message } = {}) {
    return {
      response: `[mock] mind would have responded to: ${message || "(empty)"}`,
      mock: true,
    };
  }

  async health() {
    return { status: "mock", mock: true };
  }
}

module.exports = { StubMindGateway };
