/**
 * domain/constants/index.js — defaults with environment-variable fallback.
 *
 * Originally hard-coded for raj-sadan's network topology (Pi at
 * 100.108.180.118, mobile at 100.68.56.4). For ai-senses v0.1.0 each
 * constant honors an env var so a fresh consumer can override without
 * forking.
 */

const env = process.env;

function _int(name, def) {
  const v = env[name];
  if (!v) return def;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
}

module.exports = {
  WHATSAPP_POLL_INTERVAL_MS: _int("SENSES_WHATSAPP_POLL_MS", 5_000),
  CRON_POLL_INTERVAL_MS: _int("SENSES_CRON_POLL_MS", 30_000),
  MOBILE_POLL_INTERVAL_MS: _int("SENSES_MOBILE_POLL_MS", 60_000),
  OUTCOME_CHECK_DELAY_MS: _int("SENSES_OUTCOME_DELAY_MS", 30_000),

  MIND_GATEWAY_URL: env.SENSES_MIND_CHAT_URL || "http://127.0.0.1:3486/chat",
  MIND_HEALTH_URL: env.SENSES_MIND_HEALTH_URL || "http://127.0.0.1:3486/health",

  SENSES_PORT: _int("SENSES_PORT", 3487),
  MAX_DEDUP_IDS: _int("SENSES_MAX_DEDUP_IDS", 200),

  WHATSAPP_HOST: env.SENSES_WHATSAPP_HOST || "http://127.0.0.1:3478",
  WHATSAPP_GROUPS: (env.SENSES_WHATSAPP_GROUPS || "general,alerts-reports,notes-journal,planning,design,resources,external-affairs,review")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  PORTAINER_URL: env.SENSES_PORTAINER_URL || "http://100.108.180.118:9000",
  PI_HOST: env.SENSES_PI_HOST || "100.108.180.118",

  MOBILE_AGENT_HOST: env.SENSES_MOBILE_AGENT_HOST || "http://100.68.56.4:3490",
  MOBILE_BATTERY_LOW_THRESHOLD: _int("SENSES_MOBILE_BATTERY_LOW", 15),
  MOBILE_BATTERY_CRITICAL_THRESHOLD: _int("SENSES_MOBILE_BATTERY_CRITICAL", 5),
};
