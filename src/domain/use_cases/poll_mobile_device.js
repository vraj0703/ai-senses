/**
 * poll_mobile_device — use cases for observing PM's Android device.
 *
 * pollMobileDevice: safe snapshot poll that returns null if unreachable.
 * alertOnLowBattery: derives a triggered alert from a fresh snapshot.
 *
 * Both accept a null mobileClient and degrade gracefully.
 */

/**
 * @param {object} deps
 * @param {import('../repositories/i_mobile_agent_client').IMobileAgentClient|null} deps.mobileClient
 * @returns {Promise<import('../entities/mobile_device_state').MobileDeviceState|null>}
 */
async function pollMobileDevice({ mobileClient }) {
  if (!mobileClient) return null;
  const reachable = await mobileClient.isReachable();
  if (!reachable) return null;
  return mobileClient.getSnapshot();
}

/**
 * @param {object} deps
 * @param {import('../repositories/i_mobile_agent_client').IMobileAgentClient|null} deps.mobileClient
 * @param {number} [deps.threshold=15]
 * @returns {Promise<{triggered: boolean, battery?: object, reason?: string}>}
 */
async function alertOnLowBattery({ mobileClient, threshold = 15 }) {
  const snapshot = await pollMobileDevice({ mobileClient });
  if (!snapshot) return { triggered: false, reason: "unreachable" };
  if (snapshot.isLowBattery(threshold) && !snapshot.isCharging()) {
    return { triggered: true, battery: snapshot.battery };
  }
  return { triggered: false };
}

module.exports = { pollMobileDevice, alertOnLowBattery };
