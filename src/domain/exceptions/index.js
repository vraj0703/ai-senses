class SenseError extends Error {
  constructor(message, code) { super(message); this.name = "SenseError"; this.code = code; }
}
class SourceUnavailableError extends SenseError {
  constructor(source) { super(`Source "${source}" unavailable`, "SOURCE_UNAVAILABLE"); this.source = source; }
}
class MindUnavailableError extends SenseError {
  constructor() { super("Mind v2 is not reachable", "MIND_UNAVAILABLE"); }
}

module.exports = { SenseError, SourceUnavailableError, MindUnavailableError };
