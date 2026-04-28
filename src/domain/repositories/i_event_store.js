/**
 * IEventStore — abstract interface for persisting sense events.
 */
class IEventStore {
  /** @param {import('../entities/sense_event').SenseEvent} event */
  async log(event) { throw new Error("IEventStore.log() not implemented"); }

  /** @param {number} limit @returns {Promise<object[]>} */
  async recent(limit) { throw new Error("IEventStore.recent() not implemented"); }
}

module.exports = { IEventStore };
