/**
 * StubMobileAgentClient — default mock for HttpMobileAgentClient.
 *
 * Returns synthetic mobile state without talking to a real device.
 */

class StubMobileAgentClient {
  async getStatus() {
    return {
      battery: 73,
      battery_state: "discharging",
      location: { lat: 0, lon: 0, mock: true },
      sms_unread: 0,
      mock: true,
    };
  }

  async sendSms({ to, body }) {
    return { sent: true, mock: true, to, body };
  }

  async health() {
    return { status: "mock", mock: true };
  }
}

module.exports = { StubMobileAgentClient };
