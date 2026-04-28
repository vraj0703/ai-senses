/**
 * WhatsApp signal source — polls WhatsApp gateway for new messages.
 */
const { ISignalSource } = require("../../../domain/repositories/i_signal_source");
const { Signal } = require("../../../domain/entities/signal");

class WhatsAppSource extends ISignalSource {
  constructor(opts = {}) {
    super();
    this.host = opts.host || "http://127.0.0.1:3478";
    this._processedIds = new Set();
    this._maxIds = opts.maxDedup || 200;
  }

  get name() { return "whatsapp"; }

  async isAvailable() {
    try {
      const res = await fetch(`${this.host}/health`, { signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch { return false; }
  }

  async poll() {
    try {
      const res = await fetch(`${this.host}/incoming`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return [];
      const data = await res.json();
      const messages = Array.isArray(data) ? data : data.messages || [];

      const signals = [];
      for (const msg of messages) {
        const id = msg.id || msg.key?.id || `${msg.from}-${msg.timestamp}`;
        if (this._processedIds.has(id)) continue;
        this._processedIds.add(id);
        signals.push(new Signal({
          source: "whatsapp",
          data: { sender: msg.from || msg.sender, message: msg.body || msg.text || msg.message, id },
        }));
      }

      // Trim dedup set
      if (this._processedIds.size > this._maxIds) {
        const arr = [...this._processedIds];
        this._processedIds = new Set(arr.slice(-Math.floor(this._maxIds / 2)));
      }

      return signals;
    } catch { return []; }
  }
}

module.exports = { WhatsAppSource };
