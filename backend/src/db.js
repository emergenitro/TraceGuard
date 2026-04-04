import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default pool;

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         UUID PRIMARY KEY,
      email      TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS otps (
      email      TEXT PRIMARY KEY,
      hashed_otp TEXT NOT NULL,
      salt       TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      token      TEXT PRIMARY KEY,
      user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS scans (
      id               UUID PRIMARY KEY,
      user_id          UUID REFERENCES users(id),
      asset_name       TEXT NOT NULL,
      asset_type       TEXT NOT NULL,
      progress_percent INTEGER NOT NULL DEFAULT 0,
      status           TEXT NOT NULL DEFAULT 'queued',
      started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      logs             JSONB NOT NULL DEFAULT '[]',
      nodes            JSONB NOT NULL DEFAULT '[]',
      telemetry        JSONB NOT NULL DEFAULT '{}',
      stream           JSONB NOT NULL DEFAULT '[]',
      asset_data       JSONB,
      email            TEXT
    )
  `);

  await pool.query(`
    ALTER TABLE scans ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id)
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS infringements (
      id             UUID PRIMARY KEY,
      scan_id        UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
      domain         TEXT,
      match_percent  INTEGER,
      severity       TEXT,
      tags           JSONB NOT NULL DEFAULT '[]',
      source_type    TEXT,
      status         TEXT NOT NULL DEFAULT 'UNACTIONED',
      system_note    TEXT,
      screenshot_url TEXT,
      link           TEXT,
      product_title  TEXT
    )
  `);

  console.log("  Database tables ready");
}
