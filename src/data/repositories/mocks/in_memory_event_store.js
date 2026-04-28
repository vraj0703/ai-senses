/**
 * InMemoryEventStore — default mock for JSONLEventStore.
 *
 * Holds events in memory instead of writing to disk. Useful for tests +
 * for consumers who don't want a JSONL file accumulating.
 */

class InMemoryEventStore {
  constructor() {
    this._events = [];
  }

  async append(event) {
    this._events.push({ ...event, ts: event.ts || new Date().toISOString() });
    return true;
  }

  async list({ limit = 100 } = {}) {
    return this._events.slice(-limit);
  }

  async clear() {
    this._events = [];
  }
}

module.exports = { InMemoryEventStore };
