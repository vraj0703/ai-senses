/**
 * PollingController — runs all signal sources on their schedules,
 * converts signals to events, pushes to mind.
 */

const { receiveSignal } = require("../../../domain/use_cases/receive_signal");
const { emitToMind } = require("../../../domain/use_cases/emit_to_mind");
const { scheduleOutcomeCheck } = require("../../../domain/use_cases/observe_outcome");
const C = require("../../../domain/constants");

class PollingController {
  constructor(deps) {
    this.sources = deps.sources || [];
    this.mindGateway = deps.mindGateway;
    this.diagnostic = deps.diagnostic;
    this.eventStore = deps.eventStore;
    this._intervals = [];
    this._running = false;
    this._stats = { polls: 0, signals: 0, emitted: 0, errors: 0 };
    this._pendingOutcomes = [];
  }

  start() {
    if (this._running) return;
    this._running = true;
    console.log(`[senses] started polling ${this.sources.length} source(s)`);

    for (const source of this.sources) {
      const intervalMs = this._getInterval(source.name);
      console.log(`[senses] ${source.name}: polling every ${intervalMs / 1000}s`);

      // Poll immediately, then on interval
      this._pollSource(source);
      this._intervals.push(setInterval(() => this._pollSource(source), intervalMs));
    }
  }

  stop() {
    this._running = false;
    for (const iv of this._intervals) clearInterval(iv);
    this._intervals = [];
    console.log(`[senses] stopped — ${this._stats.polls} polls, ${this._stats.signals} signals, ${this._stats.emitted} emitted`);
  }

  async _pollSource(source) {
    this._stats.polls++;
    try {
      const available = await source.isAvailable();
      if (!available) return;

      const signals = await source.poll();
      this._stats.signals += signals.length;

      for (const signal of signals) {
        const event = receiveSignal(signal);
        try {
          await emitToMind(event, this.mindGateway, this.eventStore);
          this._stats.emitted++;
        } catch (err) {
          this._stats.errors++;
          if (err.name !== "MindUnavailableError") {
            console.error(`[senses] emit error for ${source.name}:`, err.message);
          }
        }
      }
    } catch (err) {
      this._stats.errors++;
    }
  }

  /**
   * Option B: self-healing feedback loop.
   * Called by mind (via webhook) when a restart decision is made.
   * Senses waits 30s, then re-diagnoses and feeds back to mind.
   */
  async triggerOutcomeCheck(decision) {
    console.log(`[senses] scheduling outcome check for ${decision.target} in ${C.OUTCOME_CHECK_DELAY_MS / 1000}s`);
    // Run in background — don't block
    scheduleOutcomeCheck(decision, this.diagnostic, this.mindGateway, {
      delayMs: C.OUTCOME_CHECK_DELAY_MS,
    }).then(({ success, event }) => {
      console.log(`[senses] outcome for ${decision.target}: ${success ? "HEALED" : "STILL DOWN"}`);
      this._pendingOutcomes.push({ decisionId: decision.id, success, checkedAt: new Date().toISOString() });
      if (this._pendingOutcomes.length > 100) this._pendingOutcomes.shift();
    }).catch(err => {
      console.error(`[senses] outcome check failed for ${decision.target}:`, err.message);
    });
  }

  getStats() {
    return { ...this._stats, running: this._running, sources: this.sources.map(s => s.name), recentOutcomes: this._pendingOutcomes.slice(-10) };
  }

  _getInterval(name) {
    switch (name) {
      case "whatsapp": return C.WHATSAPP_POLL_INTERVAL_MS;
      case "cron": return C.CRON_POLL_INTERVAL_MS;
      case "mobile": return C.MOBILE_POLL_INTERVAL_MS;
      default: return 30_000;
    }
  }
}

module.exports = { PollingController };
