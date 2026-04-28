function registerRoutes(app, { polling }) {
  app.get("/health", (req, res) => {
    res.json({ status: "running", service: "senses-v2", version: "2.0.0" });
  });

  app.get("/stats", (req, res) => {
    res.json(polling.getStats());
  });

  // Mind calls this when it makes a restart decision.
  // Senses schedules a 30s follow-up check and feeds outcome back.
  app.post("/observe", async (req, res) => {
    const decision = req.body;
    if (!decision || !decision.target) {
      return res.status(400).json({ error: "decision with target required" });
    }
    polling.triggerOutcomeCheck(decision);
    res.json({ scheduled: true, delayMs: 30_000 });
  });

  // Manual diagnostic endpoint
  app.get("/diagnose/:service/:port", async (req, res) => {
    try {
      const report = await polling.diagnostic.diagnose({
        name: req.params.service,
        port: parseInt(req.params.port),
      });
      res.json(report.toPayload());
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

module.exports = { registerRoutes };
