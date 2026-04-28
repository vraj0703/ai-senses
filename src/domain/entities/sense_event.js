/**
 * SenseEvent — a validated, typed event ready to be emitted to mind.
 *
 * Converts raw signals into structured events that map directly
 * onto mind's Input entity.
 */

const VALID_TYPES = ["message", "job_result", "health_check", "heartbeat", "diagnostic", "outcome"];

class SenseEvent {
  constructor(raw) {
    if (!raw || typeof raw !== "object") throw new Error("SenseEvent must be an object");
    if (!VALID_TYPES.includes(raw.type)) {
      throw new Error(`Invalid event type "${raw.type}". Must be one of: ${VALID_TYPES.join(", ")}`);
    }

    this.type = raw.type;
    this.source = raw.source;
    this.sender = raw.sender || raw.source;
    this.payload = raw.payload;
    this.priority = raw.priority || "normal";
    this.signalId = raw.signalId || null;
    this.timestamp = raw.timestamp || new Date().toISOString();
    this.id = raw.id || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Convert to mind's Input format for emission.
   */
  toMindInput() {
    return {
      type: this.type === "message" ? "message"
        : this.type === "health_check" || this.type === "diagnostic" || this.type === "outcome" ? "health"
        : this.type === "job_result" ? "event"
        : "event",
      source: this.source,
      sender: this.sender,
      payload: this.payload,
      priority: this.priority,
    };
  }
}

module.exports = { SenseEvent, VALID_TYPES };
