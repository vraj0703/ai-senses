/**
 * StubSignalSource — default mock for WhatsAppSource (and any future signal source).
 *
 * Yields scripted signals on a timer so the polling loop has something
 * to work with during tests + standalone runs.
 */

class StubSignalSource {
  constructor() {
    this._counter = 0;
  }

  async poll() {
    this._counter += 1;
    return [
      {
        id: `mock-signal-${this._counter}`,
        kind: "whatsapp",
        group: "general",
        from: "Test User",
        body: `[mock] synthetic signal ${this._counter}`,
        timestamp: new Date().toISOString(),
      },
    ];
  }
}

module.exports = { StubSignalSource };
