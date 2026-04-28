/**
 * IMobileAgentClient — abstract interface for PM's Android Termux agent.
 *
 * The mobile agent is an HTTP server on the phone (Tailscale IP) exposing
 * snapshot polling + output actions (speak/vibrate/toast).
 */
class IMobileAgentClient {
  /** @returns {Promise<boolean>} */
  async isReachable() { throw new Error("not implemented"); }

  /** @returns {Promise<import('../entities/mobile_device_state').MobileDeviceState | null>} */
  async getSnapshot() { throw new Error("not implemented"); }

  /**
   * @param {string} message
   * @returns {Promise<boolean>}
   */
  async speak(message) { throw new Error("not implemented"); }

  /**
   * @param {number} durationMs
   * @returns {Promise<boolean>}
   */
  async vibrate(durationMs) { throw new Error("not implemented"); }

  /**
   * @param {string} message
   * @returns {Promise<boolean>}
   */
  async toast(message) { throw new Error("not implemented"); }
}

module.exports = { IMobileAgentClient };
