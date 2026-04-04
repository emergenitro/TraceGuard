import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import { initDb } from "./db.js";

import authRouter from "./routes/auth.js";
import investigationsRouter from "./routes/investigations.js";
import scansRouter from "./routes/scans.js";
import reportsRouter from "./routes/reports.js";
import infringementsRouter from "./routes/infringements.js";
import { requireAuth } from "./middleware/auth.js";
import { getUserAlertCount, getUserScans, getStats } from "./store.js";

const REQUIRED_ENV = ["OPENAI_API_KEY", "TINYFISH_API_KEY", "JWT_SECRET"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(
    `[startup] Missing required environment variables: ${missing.join(", ")}\n` +
    `         Copy .env.example → .env and fill in your keys.`
  );
  process.exit(1);
}

const app = express();
const PORT = parseInt(process.env.PORT || "4000", 10);

app.use(
  cors({
    origin: (origin, cb) => {
      const allowed = (process.env.FRONTEND_ORIGIN || "http://localhost:3000")
        .split(",")
        .map((o) => o.trim());
      if (!origin || allowed.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth", authLimiter, authRouter);

app.use("/api/investigations", requireAuth, investigationsRouter);
app.use("/api/scans", requireAuth, scansRouter);
app.use("/api/reports", requireAuth, reportsRouter);
app.use("/api/infringements", requireAuth, infringementsRouter);

app.get("/api/stats", async (_req, res, next) => {
  try {
    res.json(await getStats());
  } catch (err) {
    next(err);
  }
});

app.get("/api/dashboard/scans", requireAuth, async (req, res, next) => {
  try {
    res.json(await getUserScans(req.userId));
  } catch (err) {
    next(err);
  }
});

app.get("/api/stats/alerts", requireAuth, async (req, res, next) => {
  try {
    const count = await getUserAlertCount(req.userId);
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

app.get("/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

app.use((err, _req, res, _next) => {
  console.error("[error]", err);
  res.status(500).json({ error: err.message ?? "Internal server error" });
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n  TraceGuard backend   →  http://localhost:${PORT}`);
      console.log(`  Health check         →  http://localhost:${PORT}/health`);
      console.log(`  OpenAI model         →  ${process.env.OPENAI_MODEL || "gpt-4o"}`);
      console.log();
    });
  })
  .catch((err) => {
    console.error("[startup] Database initialisation failed:", err);
    process.exit(1);
  });
