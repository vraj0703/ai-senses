#!/usr/bin/env node
/**
 * ai-senses CLI dispatcher.
 *
 * Subcommands:
 *   serve      — start the HTTP perception loop (default)
 *   mcp        — start the MCP server on stdio (for Claude Code/Cursor/Codex)
 *   diagnose   — one-shot service diagnosis (port + process)
 *   capture    — fetch one round of signals + print to stdout
 *   --version
 *   --help
 */

const path = require("path");

const args = process.argv.slice(2);
const cmd = args[0];

function printHelp() {
  console.log(`\
ai-senses — infrastructure-perception layer.

usage:
  ai-senses [serve]                 start the HTTP perception loop
  ai-senses mcp                     start the MCP server on stdio
  ai-senses diagnose <name> <port>  one-shot diagnosis (default: stub)
  ai-senses capture                 fetch one round of signals
  ai-senses --version | --help

env:
  SENSES_PORT                  HTTP port (default 3487)
  SENSES_USE_REAL              comma-separated list of integrations to switch
                               from mock to real (e.g. "whatsapp,mobile,mind")
                               or "all" for everything
`);
}

(async () => {
  if (!cmd || cmd === "serve") {
    require("../src/index.js");
    return;
  }
  if (cmd === "--version" || cmd === "-V") {
    const pkg = require("../package.json");
    console.log(pkg.version);
    return;
  }
  if (cmd === "--help" || cmd === "-h") {
    printHelp();
    return;
  }
  if (cmd === "diagnose") {
    const name = args[1] || "unknown";
    const port = parseInt(args[2] || "0", 10);
    const { createContainer } = require("../src/di/container.js");
    const c = createContainer({ projectRoot: process.cwd() });
    const result = await c.diagnostic.checkPort(port);
    console.log(JSON.stringify({ name, port, ...result }, null, 2));
    return;
  }
  if (cmd === "capture") {
    const { createContainer } = require("../src/di/container.js");
    const c = createContainer({ projectRoot: process.cwd() });
    const signals = [];
    for (const src of c.sources) {
      const batch = await src.poll();
      signals.push(...batch);
    }
    console.log(JSON.stringify(signals, null, 2));
    return;
  }
  if (cmd === "mcp") {
    const { createContainer } = require("../src/di/container.js");
    const { createMcpServer, startStdio } = require("../src/presentation/mcp/server.js");
    const pkg = require("../package.json");
    const c = createContainer({ projectRoot: process.cwd() });
    const server = createMcpServer({
      container: c,
      info: { name: pkg.name, version: pkg.version },
    });
    await startStdio(server);
    return;
  }
  console.error(`unknown command: ${cmd}`);
  printHelp();
  process.exit(2);
})();
