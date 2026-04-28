/**
 * IInfrastructureClient — remote Docker / container host control interface.
 * Implementations live in data/data_sources/remote/ (e.g., PortainerClient).
 */
class IInfrastructureClient {
  /** @returns {Promise<{reachable: boolean, containers?: object[], error?: string}>} */
  async health() { throw new Error("not implemented"); }

  /** @returns {Promise<object[]|null>} Docker containers list, or null on failure */
  async listContainers() { throw new Error("not implemented"); }

  /**
   * @param {string} containerId
   * @returns {Promise<boolean>}
   */
  async restartContainer(containerId) { throw new Error("not implemented"); }

  /**
   * @param {string} containerId
   * @param {number} [tail=100]
   * @returns {Promise<string|null>}
   */
  async containerLogs(containerId, tail = 100) { throw new Error("not implemented"); }
}

module.exports = { IInfrastructureClient };
