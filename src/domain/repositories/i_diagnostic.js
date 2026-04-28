/**
 * IDiagnostic — abstract interface for diagnosing WHY a service is down.
 */
class IDiagnostic {
  /**
   * @param {{name: string, port: number}} service
   * @returns {Promise<import('../entities/diagnostic_report').DiagnosticReport>}
   */
  async diagnose(service) { throw new Error("IDiagnostic.diagnose() not implemented"); }
}

module.exports = { IDiagnostic };
