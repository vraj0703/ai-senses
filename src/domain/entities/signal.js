/**
 * Signal — raw data from the outside world before processing.
 *
 * A signal is what a sense organ picks up. It becomes a SenseEvent
 * after validation and typing, then an Input when emitted to mind.
 */

const VALID_SOURCES = ["whatsapp", "cron", "mobile", "pi", "dashboard", "webhook", "system"];

class Signal {
  constructor(raw) {
    if (!raw || typeof raw !== "object") throw new Error("Signal must be an object");
    if (!raw.source || !VALID_SOURCES.includes(raw.source)) {
      throw new Error(`Invalid signal source "${raw.source}". Must be one of: ${VALID_SOURCES.join(", ")}`);
    }

    this.source = raw.source;
    this.data = raw.data !== undefined ? raw.data : null;
    this.timestamp = raw.timestamp || new Date().toISOString();
    this.id = raw.id || `sig-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

module.exports = { Signal, VALID_SOURCES };
