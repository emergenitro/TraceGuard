import "dotenv/config";
import express from "express";
import cors from "cors";

import investigationsRouter from "./routes/investigations.js";
import scansRouter from "./routes/scans.js";
import reportsRouter from "./routes/reports.js";
import infringementsRouter from "./routes/infringements.js";

// ── Validate required env vars ────────────────────────────────────────────────

const REQUIRED_ENV = ["OPENAI_API_KEY", "TINYFISH_API_KEY"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(
    `[startup] Missing required environment variables: ${missing.join(", ")}\n` +
    `         Copy .env.example → .env and fill in your keys.`
  );
  process.exit(1);
}

// ── Express app ───────────────────────────────────────────────────────────────

const app = express();
const PORT = parseInt(process.env.PORT || "4000", 10);

// CORS — allow the frontend origin
app.use(
  cors({
    origin: (origin, cb) => {
      const allowed = (process.env.FRONTEND_ORIGIN || "http://localhost:3000")
        .split(",")
        .map((o) => o.trim());
      // Allow same-origin requests (no Origin header) and listed origins
      if (!origin || allowed.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));

// ── Routes ────────────────────────────────────────────────────────────────────

app.use("/api/investigations", investigationsRouter);
app.use("/api/scans", scansRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/infringements", infringementsRouter);

// Health check
app.get("/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

// 404 fallback
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("[error]", err);
  res.status(500).json({ error: err.message ?? "Internal server error" });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n  IP Guardian backend   →  http://localhost:${PORT}`);
  console.log(`  Health check          →  http://localhost:${PORT}/health`);
  console.log(`  OpenAI model          →  ${process.env.OPENAI_MODEL || "gpt-4o"}`);
  console.log();
});
