/**
 * StubWhatsAppClient — default mock for HttpWhatsAppClient.
 *
 * Returns synthetic [mock]-tagged responses so ai-senses runs without
 * a live WhatsApp gateway. Swap to the real client by passing
 * SENSES_USE_REAL=all (or "whatsapp") in the DI container.
 */

class StubWhatsAppClient {
  constructor() {
    this._messages = [];
  }

  async fetchMessages({ group } = {}) {
    return [
      {
        id: `mock-msg-${Date.now()}`,
        group: group || "general",
        from: "Test User",
        body: "[mock] hello from StubWhatsAppClient",
        timestamp: new Date().toISOString(),
      },
    ];
  }

  async sendMessage({ group, body }) {
    this._messages.push({ group, body, timestamp: new Date().toISOString() });
    return { sent: true, mock: true, group, body };
  }

  async health() {
    return { status: "mock", mock: true };
  }
}

module.exports = { StubWhatsAppClient };
