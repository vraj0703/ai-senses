/**
 * IMindGateway — abstract interface for pushing events to mind.
 */
class IMindGateway {
  /**
   * Send a SenseEvent to mind as an Input.
   * @param {import('../entities/sense_event').SenseEvent} event
   * @returns {Promise<{accepted: boolean, decisionId?: string, error?: string}>}
   */
  async emit(event) { throw new Error("IMindGateway.emit() not implemented"); }

  /** @returns {Promise<boolean>} */
  async isAvailable() { throw new Error("IMindGateway.isAvailable() not implemented"); }
}

module.exports = { IMindGateway };
