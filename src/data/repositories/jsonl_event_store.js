/**
 * JSONLEventStore — append-only event log.
 */
const fs = require("fs");
const path = require("path");
const { IEventStore } = require("../../domain/repositories/i_event_store");

class JSONLEventStore extends IEventStore {
  constructor(opts = {}) {
    super();
    this.filePath = opts.filePath || path.resolve(process.cwd(), "senses", "nociception", "logs", "sense-events.jsonl");
  }

  async log(event) {
    const dir = path.dirname(this.filePath);
    fs.mkdirSync(dir, { recursive: true });
    const entry = { id: event.id, type: event.type, source: event.source, sender: event.sender, timestamp: event.timestamp, priority: event.priority };
    fs.appendFileSync(this.filePath, JSON.stringify(entry) + "\n", "utf-8");
  }

  async recent(limit = 50) {
    if (!fs.existsSync(this.filePath)) return [];
    const lines = fs.readFileSync(this.filePath, "utf-8").trim().split("\n").filter(Boolean);
    return lines.slice(-limit).reverse().map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  }
}

module.exports = { JSONLEventStore };
