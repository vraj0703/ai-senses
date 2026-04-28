/**
 * Raj Sadan Senses v2 — Entry Point
 *
 * Polls external sources (WhatsApp, cron, mobile) → converts to events → pushes to mind v2.
 * Also provides: service diagnosis (WHY is something down?) and outcome observation
 * (did mind's restart decision actually work?).
 *
 * Start:  node v2/senses/index.js
 * Test:   node --test v2/senses/domain/use_cases/*.test.js
 * Health: curl http://127.0.0.1:3487/health
 * Stats:  curl http://127.0.0.1:3487/stats
 * Diagnose: curl http://127.0.0.1:3487/diagnose/whatsapp/3478
 */

const path = require("path");
const { createContainer } = require("./di/container");
const { PollingController } = require("./presentation/state_management/controllers/polling_controller");
const { createServer } = require("./presentation/pages/server");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const PORT = parseInt(process.env.SENSES_PORT) || 3487;

async function main() {
  console.log("╔══════════════════════════════════════╗");
  console.log("║     Raj Sadan Senses v2              ║");
  console.log("║     Perception · Diagnosis · Healing ║");
  console.log("╚══════════════════════════════════════╝");
  console.log();

  const container = createContainer({ projectRoot: PROJECT_ROOT, port: PORT });
  const polling = new PollingController(container);
  const { listen } = createServer({ polling, port: PORT });

  await listen();
  polling.start();

  const shutdown = () => {
    console.log("\n[senses-v2] shutting down...");
    polling.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch(err => { console.error("[senses-v2] fatal:", err); process.exit(1); });
