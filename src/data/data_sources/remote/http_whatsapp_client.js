/**
 * HttpWhatsAppClient — concrete IWhatsAppClient over HTTP.
 *
 * Talks to the WhatsApp gateway service (default http://127.0.0.1:3478).
 * Uses native fetch + AbortSignal.timeout. Never throws on network failures;
 * returns false/null and logs to stdout so callers can degrade gracefully.
 */

const { IWhatsAppClient } = require("../../../domain/repositories/i_whatsapp_client");
const { WHATSAPP_HOST, WHATSAPP_GROUPS } = require("../../../domain/constants");

const TIMEOUT_MS = 5000;

class HttpWhatsAppClient extends IWhatsAppClient {
  /**
   * @param {object} [opts]
   * @param {string} [opts.host] - WhatsApp gateway base URL
   */
  constructor(opts = {}) {
    super();
    this.host = opts.host || WHATSAPP_HOST;
  }

  async health() {
    try {
      const res = await fetch(`${this.host}/health`, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) {
        console.log(`[senses-v2] whatsapp: health HTTP ${res.status}`);
        return null;
      }
      return await res.json();
    } catch (err) {
      console.log(`[senses-v2] whatsapp: health error: ${err.message}`);
      return null;
    }
  }

  async sendDirect(to, message) {
    if (!to || !message) {
      console.log("[senses-v2] whatsapp: sendDirect missing to/message");
      return false;
    }
    try {
      const res = await fetch(`${this.host}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, message }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) {
        console.log(`[senses-v2] whatsapp: sendDirect HTTP ${res.status}`);
        return false;
      }
      const data = await res.json().catch(() => ({}));
      return data.ok === true;
    } catch (err) {
      console.log(`[senses-v2] whatsapp: sendDirect error: ${err.message}`);
      return false;
    }
  }

  async sendGroup(group, message) {
    if (!WHATSAPP_GROUPS.includes(group)) {
      console.log(`[senses-v2] whatsapp: invalid group "${group}"`);
      return false;
    }
    if (!message) {
      console.log("[senses-v2] whatsapp: sendGroup missing message");
      return false;
    }
    try {
      const res = await fetch(`${this.host}/send-group`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group, message }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) {
        console.log(`[senses-v2] whatsapp: sendGroup HTTP ${res.status}`);
        return false;
      }
      const data = await res.json().catch(() => ({}));
      return data.ok === true;
    } catch (err) {
      console.log(`[senses-v2] whatsapp: sendGroup error: ${err.message}`);
      return false;
    }
  }

  async getIncoming() {
    try {
      const res = await fetch(`${this.host}/incoming`, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) {
        console.log(`[senses-v2] whatsapp: getIncoming HTTP ${res.status}`);
        return [];
      }
      const data = await res.json();
      if (Array.isArray(data)) return data;
      return Array.isArray(data.messages) ? data.messages : [];
    } catch (err) {
      console.log(`[senses-v2] whatsapp: getIncoming error: ${err.message}`);
      return [];
    }
  }
}

module.exports = { HttpWhatsAppClient };
