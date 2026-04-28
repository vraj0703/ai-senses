/**
 * Infrastructure monitoring use cases.
 *
 * Wraps an IInfrastructureClient (e.g., PortainerClient on the Pi) so higher
 * layers can check reachability, list containers, and restart them without
 * caring about the underlying transport.
 */

/**
 * @param {object} params
 * @param {import('../repositories/i_infrastructure_client').IInfrastructureClient} params.infraClient
 * @returns {Promise<{reachable: boolean, error?: string}>}
 */
async function checkInfrastructureHealth({ infraClient }) {
  if (!infraClient) return { reachable: false, error: "no client" };
  return infraClient.health();
}

/**
 * @param {object} params
 * @param {import('../repositories/i_infrastructure_client').IInfrastructureClient} params.infraClient
 * @returns {Promise<object[]|null>}
 */
async function listPiContainers({ infraClient }) {
  if (!infraClient) return null;
  return infraClient.listContainers();
}

/**
 * @param {object} params
 * @param {import('../repositories/i_infrastructure_client').IInfrastructureClient} params.infraClient
 * @param {string} params.containerId
 * @returns {Promise<boolean>}
 */
async function restartPiContainer({ infraClient, containerId }) {
  if (!infraClient) return false;
  if (!containerId) return false;
  return infraClient.restartContainer(containerId);
}

module.exports = {
  checkInfrastructureHealth,
  listPiContainers,
  restartPiContainer,
};
