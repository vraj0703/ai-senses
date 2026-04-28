/**
 * HttpMobileAgentClient — concrete IMobileAgentClient over HTTP.
 *
 * Talks to the v1 mobile agent running in Termux on PM's Android device
 * (default http://100.68.56.4:3490, Tailscale IP).
 *
 * Native fetch + AbortSignal.timeout. Never throws on network failures;
 * returns false/null so callers can degrade gracefully.
 */

const { IMobileAgentClient } = require("../../../domain/repositories/i_mobile_agent_client");
const { MobileDeviceState } = require("../../../domain/entities/mobile_device_state");
const { MOBILE_AGENT_HOST } = require("../../../domain/constants");

const HEALTH_TIMEOUT_MS = 3000;
const OP_TIMEOUT_MS = 5000;

class HttpMobileAgentClient extends IMobileAgentClient {
  /**
   * @param {object} [opts]
   * @param {string} [opts.host] - Mobile agent base URL
   */
  constructor(opts = {}) {
    super();
    this.host = opts.host || MOBILE_AGENT_HOST;
  }

  async isReachable() {
    try {
      const res = await fetch(`${this.host}/health`, {
        signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
      });
      return res.ok;
    } catch (err) {
      console.log(`[senses-v2] mobile: health error: ${err.message}`);
      return false;
    }
  }

  async getSnapshot() {
    try {
      const res = await fetch(`${this.host}/snapshot`, {
        signal: AbortSignal.timeout(OP_TIMEOUT_MS),
      });
      if (!res.ok) {
        console.log(`[senses-v2] mobile: snapshot HTTP ${res.status}`);
        return null;
      }
      const raw = await res.json();
      // Defensive: timestamp may be missing on some agent versions; synth now.
      if (!raw.timestamp) raw.timestamp = new Date().toISOString();
      return new MobileDeviceState(raw);
    } catch (err) {
      console.log(`[senses-v2] mobile: snapshot error: ${err.message}`);
      return null;
    }
  }

  async speak(message) {
    if (!message) {
      console.log("[senses-v2] mobile: speak missing message");
      return false;
    }
    try {
      const res = await fetch(`${this.host}/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message }),
        signal: AbortSignal.timeout(OP_TIMEOUT_MS),
      });
      if (!res.ok) {
        console.log(`[senses-v2] mobile: speak HTTP ${res.status}`);
        return false;
      }
      const body = await res.json().catch(() => ({}));
      return body.ok === true || res.status === 200;
    } catch (err) {
      console.log(`[senses-v2] mobile: speak error: ${err.message}`);
      return false;
    }
  }

  async vibrate(durationMs) {
    if (!Number.isFinite(durationMs) || durationMs <= 0) {
      console.log("[senses-v2] mobile: vibrate invalid duration");
      return false;
    }
    try {
      const res = await fetch(`${this.host}/vibrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration: durationMs }),
        signal: AbortSignal.timeout(OP_TIMEOUT_MS),
      });
      if (!res.ok) {
        console.log(`[senses-v2] mobile: vibrate HTTP ${res.status}`);
        return false;
      }
      const body = await res.json().catch(() => ({}));
      return body.ok === true || res.status === 200;
    } catch (err) {
      console.log(`[senses-v2] mobile: vibrate error: ${err.message}`);
      return false;
    }
  }

  async toast(message) {
    if (!message) {
      console.log("[senses-v2] mobile: toast missing message");
      return false;
    }
    try {
      const res = await fetch(`${this.host}/toast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
        signal: AbortSignal.timeout(OP_TIMEOUT_MS),
      });
      if (!res.ok) {
        console.log(`[senses-v2] mobile: toast HTTP ${res.status}`);
        return false;
      }
      const body = await res.json().catch(() => ({}));
      return body.ok === true || res.status === 200;
    } catch (err) {
      console.log(`[senses-v2] mobile: toast error: ${err.message}`);
      return false;
    }
  }
}

module.exports = { HttpMobileAgentClient };
