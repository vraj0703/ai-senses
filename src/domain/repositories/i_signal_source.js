/**
 * ISignalSource — abstract interface for polling an external source.
 */
class ISignalSource {
  /** @returns {string} source name */
  get name() { throw new Error("not implemented"); }

  /** @returns {Promise<import('../entities/signal').Signal[]>} new signals since last poll */
  async poll() { throw new Error("ISignalSource.poll() not implemented"); }

  /** @returns {Promise<boolean>} */
  async isAvailable() { throw new Error("ISignalSource.isAvailable() not implemented"); }
}

module.exports = { ISignalSource };
