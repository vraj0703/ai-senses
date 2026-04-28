/**
 * WhatsApp operation use cases.
 *
 * Pure orchestration — all I/O is delegated to an injected IWhatsAppClient.
 * Each use case returns a plain value (boolean / object / null); errors are
 * swallowed at the client boundary so use cases never throw.
 */

const { WHATSAPP_GROUPS } = require("../constants");

/**
 * Send a direct WhatsApp message.
 * @param {object} params
 * @param {import('../repositories/i_whatsapp_client').IWhatsAppClient} params.whatsappClient
 * @param {string} params.to
 * @param {string} params.message
 * @returns {Promise<boolean>}
 */
async function sendWhatsAppMessage({ whatsappClient, to, message }) {
  if (!whatsappClient) return false;
  if (!to || !message) return false;
  return whatsappClient.sendDirect(to, message);
}

/**
 * Send a WhatsApp message to a named group.
 * Validates group against WHATSAPP_GROUPS before hitting the client.
 * @param {object} params
 * @param {import('../repositories/i_whatsapp_client').IWhatsAppClient} params.whatsappClient
 * @param {string} params.group
 * @param {string} params.message
 * @returns {Promise<boolean>}
 */
async function sendWhatsAppGroup({ whatsappClient, group, message }) {
  if (!whatsappClient) return false;
  if (!WHATSAPP_GROUPS.includes(group)) return false;
  if (!message) return false;
  return whatsappClient.sendGroup(group, message);
}

/**
 * Fetch WhatsApp gateway health.
 * @param {object} params
 * @param {import('../repositories/i_whatsapp_client').IWhatsAppClient} params.whatsappClient
 * @returns {Promise<object|null>}
 */
async function getWhatsAppHealth({ whatsappClient }) {
  if (!whatsappClient) return null;
  return whatsappClient.health();
}

module.exports = {
  sendWhatsAppMessage,
  sendWhatsAppGroup,
  getWhatsAppHealth,
};
