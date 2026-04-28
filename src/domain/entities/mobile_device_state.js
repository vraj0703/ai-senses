/**
 * MobileDeviceState — snapshot of PM's Android device (via Termux agent).
 *
 * Normalized entity: battery, wifi, location, location context, uptime.
 * Convenience predicates for low battery and charging state.
 */
class MobileDeviceState {
  /**
   * @param {object} raw - raw snapshot payload from mobile agent /snapshot
   */
  constructor(raw) {
    if (!raw || typeof raw !== "object") {
      throw new Error("MobileDeviceState requires raw snapshot object");
    }
    if (!raw.timestamp) throw new Error("MobileDeviceState timestamp required");
    this.timestamp = raw.timestamp;
    this.battery = raw.battery || null;              // { percent, status, temperature }
    this.wifi = raw.wifi || null;                    // { ssid, ip, rssi }
    this.location = raw.location || null;            // { lat, lng, accuracy }
    this.locationContext = raw.locationContext || "unknown"; // home|away|nearby|traveling
    this.uptime = raw.uptime || 0;
  }

  /**
   * @param {number} [threshold=15]
   * @returns {boolean}
   */
  isLowBattery(threshold = 15) {
    return !!(this.battery && this.battery.percent != null && this.battery.percent < threshold);
  }

  /** @returns {boolean} */
  isCharging() {
    if (!this.battery) return false;
    const status = String(this.battery.status || "").toLowerCase();
    // Match "charging" / "full" but not "discharging" / "not_charging".
    if (status.includes("discharging") || status.includes("not_charging") || status.includes("not charging")) {
      return false;
    }
    return status.includes("charging") || status === "full";
  }
}

module.exports = { MobileDeviceState };
