module.exports = {
  ...require("./i_signal_source"),
  ...require("./i_mind_gateway"),
  ...require("./i_diagnostic"),
  ...require("./i_event_store"),
  ...require("./i_whatsapp_client"),
  ...require("./i_infrastructure_client"),
  ...require("./i_mobile_agent_client"),
};
