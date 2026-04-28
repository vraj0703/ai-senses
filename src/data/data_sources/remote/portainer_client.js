/**
 * PortainerClient — IInfrastructureClient over Portainer HTTP API.
 *
 * Primary control plane for the Pi (100.108.180.118). Auth is either a
 * pre-issued API token (PORTAINER_TOKEN) or username/password fallback
 * (PORTAINER_USER / PORTAINER_PASS) which is exchanged for a JWT on demand.
 *
 * Every call uses a 10s timeout (Pi can be slow) and never throws — errors
 * are logged and degraded values (null / {reachable: false}) are returned.
 */

const { IInfrastructureClient } = require("../../../domain/repositories/i_infrastructure_client");
const { PORTAINER_URL } = require("../../../domain/constants");

const TIMEOUT_MS = 10000;

class PortainerClient extends IInfrastructureClient {
  /**
   * @param {object} [opts]
   * @param {string} [opts.url] - Portainer base URL
   * @param {string} [opts.token] - Pre-issued API token / JWT
   * @param {string} [opts.user]
   * @param {string} [opts.pass]
   */
  constructor(opts = {}) {
    super();
    this.url = opts.url || PORTAINER_URL;
    this._token = opts.token || process.env.PORTAINER_TOKEN || null;
    this._user = opts.user || process.env.PORTAINER_USER || null;
    this._pass = opts.pass || process.env.PORTAINER_PASS || null;
    this._endpointId = null;
  }

  _headers() {
    const h = { "Content-Type": "application/json" };
    if (this._token) h["Authorization"] = `Bearer ${this._token}`;
    return h;
  }

  async _auth() {
    if (this._token) return this._token;
    if (!this._user || !this._pass) return null;
    try {
      const res = await fetch(`${this.url}/api/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Username: this._user, Password: this._pass }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) {
        console.log(`[senses-v2] portainer: auth HTTP ${res.status}`);
        return null;
      }
      const data = await res.json();
      this._token = data.jwt || null;
      return this._token;
    } catch (err) {
      console.log(`[senses-v2] portainer: auth error: ${err.message}`);
      return null;
    }
  }

  async _getEndpoint() {
    if (this._endpointId) return this._endpointId;
    await this._auth();
    try {
      const res = await fetch(`${this.url}/api/endpoints`, {
        headers: this._headers(),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) {
        console.log(`[senses-v2] portainer: endpoints HTTP ${res.status}`);
        return null;
      }
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        this._endpointId = data[0].Id;
        return this._endpointId;
      }
      return null;
    } catch (err) {
      console.log(`[senses-v2] portainer: endpoints error: ${err.message}`);
      return null;
    }
  }

  async health() {
    await this._auth();
    try {
      const res = await fetch(`${this.url}/api/endpoints`, {
        headers: this._headers(),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) {
        return { reachable: false, error: `HTTP ${res.status}` };
      }
      return { reachable: true };
    } catch (err) {
      console.log(`[senses-v2] portainer: health error: ${err.message}`);
      return { reachable: false, error: err.message };
    }
  }

  async listContainers() {
    const eid = await this._getEndpoint();
    if (!eid) return null;
    try {
      const res = await fetch(
        `${this.url}/api/endpoints/${eid}/docker/containers/json?all=true`,
        { headers: this._headers(), signal: AbortSignal.timeout(TIMEOUT_MS) },
      );
      if (!res.ok) {
        console.log(`[senses-v2] portainer: listContainers HTTP ${res.status}`);
        return null;
      }
      return await res.json();
    } catch (err) {
      console.log(`[senses-v2] portainer: listContainers error: ${err.message}`);
      return null;
    }
  }

  async restartContainer(containerId) {
    if (!containerId) return false;
    const eid = await this._getEndpoint();
    if (!eid) return false;
    try {
      const res = await fetch(
        `${this.url}/api/endpoints/${eid}/docker/containers/${containerId}/restart`,
        { method: "POST", headers: this._headers(), signal: AbortSignal.timeout(TIMEOUT_MS) },
      );
      if (!res.ok) {
        console.log(`[senses-v2] portainer: restart HTTP ${res.status}`);
        return false;
      }
      return true;
    } catch (err) {
      console.log(`[senses-v2] portainer: restart error: ${err.message}`);
      return false;
    }
  }

  async containerLogs(containerId, tail = 100) {
    if (!containerId) return null;
    const eid = await this._getEndpoint();
    if (!eid) return null;
    try {
      const res = await fetch(
        `${this.url}/api/endpoints/${eid}/docker/containers/${containerId}/logs?stdout=true&stderr=true&tail=${tail}`,
        { headers: this._headers(), signal: AbortSignal.timeout(TIMEOUT_MS) },
      );
      if (!res.ok) {
        console.log(`[senses-v2] portainer: logs HTTP ${res.status}`);
        return null;
      }
      return await res.text();
    } catch (err) {
      console.log(`[senses-v2] portainer: logs error: ${err.message}`);
      return null;
    }
  }
}

module.exports = { PortainerClient };
