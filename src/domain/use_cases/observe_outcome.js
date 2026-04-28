/**
 * ObserveOutcome — the self-healing feedback loop.
 *
 * After mind makes a restart decision, senses waits, then checks:
 * did the restart actually work? Produces an outcome event
 * that feeds back into mind for strategy reinforcement.
 */

const { SenseEvent } = require("../entities/sense_event");
const { OUTCOME_CHECK_DELAY_MS } = require("../constants");

/**
 * Schedule an outcome observation after a restart decision.
 *
 * @param {object} decision - mind's restart decision (from /decisions endpoint)
 * @param {import('../repositories/i_diagnostic').IDiagnostic} diagnostic
 * @param {import('../repositories/i_mind_gateway').IMindGateway} mindGateway
 * @param {object} [opts]
 * @param {number} [opts.delayMs]
 */
async function scheduleOutcomeCheck(decision, diagnostic, mindGateway, opts = {}) {
  const delayMs = opts.delayMs ?? OUTCOME_CHECK_DELAY_MS;

  // Extract service name from decision target "service:whatsapp" → "whatsapp"
  const serviceName = decision.target?.replace("service:", "") || "unknown";
  const port = decision.payload?.port || 0;

  // Wait for the service to have time to restart
  await sleep(delayMs);

  // Diagnose current state
  const report = await diagnostic.diagnose({ name: serviceName, port });

  // Build outcome event
  const success = report.processRunning && report.portBound;
  const event = new SenseEvent({
    type: "outcome",
    source: "system",
    sender: `observer:${serviceName}`,
    payload: {
      decisionId: decision.id,
      serviceName,
      success,
      diagnostic: report.toPayload(),
      checkedAfterMs: delayMs,
    },
    priority: success ? "normal" : "urgent",
  });

  // Feed back to mind
  try {
    await mindGateway.emit(event);
  } catch {
    // Mind might be down — log locally, don't crash
  }

  return { success, event, report };
}

/**
 * Evaluate whether a decision's outcome was positive.
 * Pure logic — used by mind's strategy reinforcement later.
 *
 * @param {object} outcome - the outcome payload from a SenseEvent
 * @returns {{ quality: number, shouldReinforce: boolean, shouldWeaken: boolean }}
 */
function evaluateOutcome(outcome) {
  if (outcome.success) {
    return { quality: 1.0, shouldReinforce: true, shouldWeaken: false };
  }

  // Partial success: process running but port not bound yet (may still be starting)
  if (outcome.diagnostic?.processRunning && !outcome.diagnostic?.portBound) {
    return { quality: 0.3, shouldReinforce: false, shouldWeaken: false };
  }

  // Total failure
  return { quality: 0.0, shouldReinforce: false, shouldWeaken: true };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { scheduleOutcomeCheck, evaluateOutcome };
