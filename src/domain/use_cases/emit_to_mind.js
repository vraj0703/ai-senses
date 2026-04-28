/**
 * EmitToMind — push a SenseEvent to mind as an Input.
 *
 * This is the bridge between senses and mind.
 * Uses IMindGateway (injected) for actual HTTP call.
 */

const { MindUnavailableError } = require("../exceptions");

/**
 * @param {import('../entities/sense_event').SenseEvent} event
 * @param {import('../repositories/i_mind_gateway').IMindGateway} gateway
 * @param {import('../repositories/i_event_store').IEventStore} [eventStore]
 * @returns {Promise<{accepted: boolean, decisionId?: string}>}
 */
async function emitToMind(event, gateway, eventStore) {
  // Log the event regardless of mind availability
  if (eventStore) {
    try { await eventStore.log(event); } catch { /* non-fatal */ }
  }

  const available = await gateway.isAvailable();
  if (!available) {
    throw new MindUnavailableError();
  }

  return gateway.emit(event);
}

module.exports = { emitToMind };
