/**
 * MCP server — exposes ai-senses primitives as MCP tools.
 *
 * Wraps the same DI container the HTTP server uses. AI Agent CLIs
 * (Claude Code, Cursor, Codex) connect via stdio and call these tools
 * directly — no HTTP layer in between.
 *
 * Four tools today:
 *   senses_capture         — fetch one round of signals from every source
 *   senses_diagnose        — diagnose a service (port + process)
 *   senses_mobile_status   — battery / location / SMS state
 *   senses_send_whatsapp   — send a WhatsApp message
 *
 * Adding a tool: register it here + document it in the README.
 */

const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");

/**
 * Build a configured McpServer wrapping the given container.
 *
 * @param {object} deps
 * @param {object} deps.container - the DI container from src/di/container.js
 * @param {object} [deps.info]    - { name, version }
 * @returns {McpServer}
 */
function createMcpServer({ container, info = {} }) {
  const server = new McpServer({
    name: info.name || "ai-senses",
    version: info.version || "0.1.0",
  });

  // ── senses_capture ───────────────────────────────────────────
  server.registerTool(
    "senses_capture",
    {
      title: "Capture one round of signals",
      description:
        "Fetch one batch of signals from every configured source (WhatsApp, mobile, etc.). Returns the raw signals — useful for showing the agent what's currently coming in from the outside world.",
      inputSchema: {
        max: z.number().int().positive().optional().describe("Cap the number of signals returned (default: no cap)"),
      },
    },
    async (args) => {
      const all = [];
      for (const src of container.sources) {
        const batch = await src.poll();
        all.push(...batch);
        if (args.max && all.length >= args.max) break;
      }
      const signals = args.max ? all.slice(0, args.max) : all;
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ count: signals.length, signals }, null, 2),
        }],
      };
    },
  );

  // ── senses_diagnose ──────────────────────────────────────────
  server.registerTool(
    "senses_diagnose",
    {
      title: "Diagnose a service",
      description:
        "Check whether a port is listening and identify the process holding it. Use this when a service appears unhealthy and you need to know whether the process is running, gone, or hung.",
      inputSchema: {
        port: z.number().int().positive().describe("The TCP port to check"),
        name: z.string().optional().describe("Friendly service name (informational only)"),
      },
    },
    async (args) => {
      const result = await container.diagnostic.checkPort(args.port);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ name: args.name || null, ...result }, null, 2),
        }],
      };
    },
  );

  // ── senses_mobile_status ─────────────────────────────────────
  server.registerTool(
    "senses_mobile_status",
    {
      title: "Get mobile device status",
      description:
        "Battery level, charging state, location, unread SMS count from the configured mobile agent. Returns synthetic data when running with the default mock — switch to real with SENSES_USE_REAL=mobile.",
      inputSchema: {},
    },
    async () => {
      const status = await container.mobileClient.getStatus();
      return {
        content: [{ type: "text", text: JSON.stringify(status, null, 2) }],
      };
    },
  );

  // ── senses_send_whatsapp ─────────────────────────────────────
  server.registerTool(
    "senses_send_whatsapp",
    {
      title: "Send a WhatsApp message",
      description:
        "Post a message to a WhatsApp group via the configured gateway. With the default mock this is a no-op that records what would have been sent.",
      inputSchema: {
        group: z.string().describe("Target group name"),
        body: z.string().describe("Message body"),
      },
    },
    async (args) => {
      const result = await container.whatsappClient.sendMessage({
        group: args.group,
        body: args.body,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  return server;
}

/**
 * Connect an McpServer to stdio and start handling requests.
 * Returns when the connection closes (client disconnects).
 */
async function startStdio(server) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

module.exports = { createMcpServer, startStdio };
