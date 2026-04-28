/**
 * ReceiveSignal — convert raw signals into typed SenseEvents.
 * Pure logic: no I/O.
 */

const { Signal } = require("../entities/signal");
const { SenseEvent } = require("../entities/sense_event");

/**
 * @param {Signal} signal
 * @returns {SenseEvent}
 */
function receiveSignal(signal) {
  const data = signal.data || {};

  switch (signal.source) {
    case "whatsapp":
      return new SenseEvent({
        type: "message",
        source: "whatsapp",
        sender: data.sender || data.from || "unknown",
        payload: data.message || data.text || data.body || "",
        priority: data.priority || "normal",
        signalId: signal.id,
      });

    case "cron":
      return new SenseEvent({
        type: "job_result",
        source: "cron",
        sender: data.job_key || data.jobKey || "cron",
        payload: {
          jobKey: data.job_key || data.jobKey,
          jobName: data.job_name || data.jobName,
          success: data.success !== false,
          reason: data.failure_reason || data.reason || null,
          elapsed: data.elapsed || null,
        },
        priority: data.success === false ? "urgent" : "normal",
        signalId: signal.id,
      });

    case "mobile":
      return new SenseEvent({
        type: "heartbeat",
        source: "mobile",
        sender: "phone",
        payload: {
          battery: data.battery,
          connectivity: data.connectivity,
          charging: data.charging,
        },
        signalId: signal.id,
      });

    case "system":
      return new SenseEvent({
        type: data.type || "health_check",
        source: "system",
        sender: data.service || "system",
        payload: data,
        priority: data.priority || "normal",
        signalId: signal.id,
      });

    default:
      return new SenseEvent({
        type: "message",
        source: signal.source,
        sender: signal.source,
        payload: signal.data,
        signalId: signal.id,
      });
  }
}

module.exports = { receiveSignal };
