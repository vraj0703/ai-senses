/**
 * StubInfrastructureClient — default mock for PortainerClient.
 */

class StubInfrastructureClient {
  async listContainers() {
    return [
      { id: "mock-1", name: "mock-service", state: "running", mock: true },
    ];
  }

  async restart(_id) {
    return { restarted: true, mock: true };
  }

  async health() {
    return { status: "mock", mock: true };
  }
}

module.exports = { StubInfrastructureClient };
