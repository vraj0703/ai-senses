/**
 * DiagnosticReport — WHY a service is down, not just THAT it's down.
 */

class DiagnosticReport {
  constructor(raw) {
    this.serviceName = raw.serviceName;
    this.port = raw.port;
    this.timestamp = raw.timestamp || new Date().toISOString();
    this.processRunning = raw.processRunning || false;
    this.portBound = raw.portBound || false;
    this.lastError = raw.lastError || null;
    this.httpStatus = raw.httpStatus || null;
    this.responseMs = raw.responseMs || null;
    this.possibleCause = raw.possibleCause || "unknown";
    this.suggestion = raw.suggestion || null;
  }

  toPayload() {
    return {
      service: this.serviceName,
      port: this.port,
      processRunning: this.processRunning,
      portBound: this.portBound,
      lastError: this.lastError,
      possibleCause: this.possibleCause,
      suggestion: this.suggestion,
      responseMs: this.responseMs,
    };
  }
}

module.exports = { DiagnosticReport };
