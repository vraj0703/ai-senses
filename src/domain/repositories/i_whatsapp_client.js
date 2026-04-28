/**
 * IWhatsAppClient — outbound WhatsApp messaging + health interface.
 * Implementations live in data/data_sources/remote/.
 */
class IWhatsAppClient {
  /** @returns {Promise<{status: string, groups: object, uptime: number}|null>} */
  async health() { throw new Error("not implemented"); }

  /**
   * Send a direct message to a phone number / contact id.
   * @param {string} to - phone number or contact id
   * @param {string} message
   * @returns {Promise<boolean>}
   */
  async sendDirect(to, message) { throw new Error("not implemented"); }

  /**
   * Send a message to a named group.
   * @param {string} group - one of the configured group keys
   * @param {string} message
   * @returns {Promise<boolean>}
   */
  async sendGroup(group, message) { throw new Error("not implemented"); }

  /** @returns {Promise<object[]>} recent incoming messages (may be empty) */
  async getIncoming() { throw new Error("not implemented"); }
}

module.exports = { IWhatsAppClient };
