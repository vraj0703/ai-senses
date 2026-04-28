/**
 * DiagnoseService — figure out WHY a service is down.
 *
 * Goes beyond "is it healthy?" to answer "why not?"
 * Returns a DiagnosticReport with possible cause and suggestion.
 */

const { DiagnosticReport } = require("../entities/diagnostic_report");

/**
 * @param {{name: string, port: number, status: string}} service
 * @param {import('../repositories/i_diagnostic').IDiagnostic} diagnostic
 * @returns {Promise<DiagnosticReport>}
 */
async function diagnoseService(service, diagnostic) {
  return diagnostic.diagnose(service);
}

/**
 * Infer a possible cause from a DiagnosticReport.
 * Pure logic — no I/O.
 *
 * @param {DiagnosticReport} report
 * @returns {{ cause: string, suggestion: string }}
 */
function inferCause(report) {
  if (!report.portBound && !report.processRunning) {
    return {
      cause: "process_not_running",
      suggestion: `Service ${report.serviceName} has no process. Restart the service.`,
    };
  }

  if (report.portBound && !report.processRunning) {
    return {
      cause: "port_conflict",
      suggestion: `Port ${report.port} is bound by another process. Kill the conflicting process first.`,
    };
  }

  if (report.processRunning && !report.portBound) {
    return {
      cause: "process_not_listening",
      suggestion: `Process exists but not listening on port ${report.port}. Service may be stuck in startup. Restart.`,
    };
  }

  if (report.processRunning && report.portBound && report.httpStatus && report.httpStatus >= 500) {
    return {
      cause: "internal_error",
      suggestion: `Service running but returning HTTP ${report.httpStatus}. Check logs.`,
    };
  }

  if (report.processRunning && report.portBound && report.lastError) {
    return {
      cause: "connection_refused",
      suggestion: `Process running, port bound, but health check failed: ${report.lastError}`,
    };
  }

  return {
    cause: "unknown",
    suggestion: `Unable to determine cause. Manual investigation needed.`,
  };
}

module.exports = { diagnoseService, inferCause };
