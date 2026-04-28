/**
 * StubDiagnostic — default mock for ProcessDiagnostic.
 */

class StubDiagnostic {
  async checkPort(port) {
    return { port, listening: true, pid: 12345, mock: true };
  }

  async findProcess(_name) {
    return { pid: 12345, name: "mock-process", mock: true };
  }
}

module.exports = { StubDiagnostic };
