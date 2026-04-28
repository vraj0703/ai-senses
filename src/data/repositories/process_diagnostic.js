/**
 * ProcessDiagnostic — diagnose WHY a service is down using OS-level checks.
 */
const { IDiagnostic } = require("../../domain/repositories/i_diagnostic");
const { DiagnosticReport } = require("../../domain/entities/diagnostic_report");
const { execSync } = require("child_process");
const { inferCause } = require("../../domain/use_cases/diagnose_service");

class ProcessDiagnostic extends IDiagnostic {
  async diagnose(service) {
    const portBound = this._isPortBound(service.port);
    const processRunning = portBound ? this._getProcessOnPort(service.port) : false;
    let httpStatus = null;
    let lastError = null;
    let responseMs = null;

    // Try HTTP health check
    try {
      const url = `http://127.0.0.1:${service.port}/health`;
      const start = Date.now();
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      responseMs = Date.now() - start;
      httpStatus = res.status;
    } catch (err) {
      lastError = err.message;
    }

    const report = new DiagnosticReport({
      serviceName: service.name,
      port: service.port,
      processRunning: !!processRunning,
      portBound,
      httpStatus,
      lastError,
      responseMs,
    });

    const { cause, suggestion } = inferCause(report);
    report.possibleCause = cause;
    report.suggestion = suggestion;

    return report;
  }

  _isPortBound(port) {
    try {
      const output = execSync(`netstat -ano 2>nul | findstr ":${port} "`, { encoding: "utf-8", timeout: 3000 });
      return output.includes("LISTENING");
    } catch { return false; }
  }

  _getProcessOnPort(port) {
    try {
      const output = execSync(`netstat -ano 2>nul | findstr ":${port} " | findstr "LISTENING"`, { encoding: "utf-8", timeout: 3000 });
      const match = output.trim().split(/\s+/).pop();
      return match ? parseInt(match) : false;
    } catch { return false; }
  }
}

module.exports = { ProcessDiagnostic };
