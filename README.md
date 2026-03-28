# TraceGuard

An AI-powered web application that automatically scans the internet for copyright, patent, trademark, and product IP infringement. Submit your asset, and the system deploys browser agents across relevant websites to find and report potential violations.

---

## How It Works

```
User submits asset (name, type, URL, file)
        │
        ▼
  GPT-4o analyses the asset
  → generates description, key features, and a
    list of 3–12 high-risk target websites
        │
        ▼
  TinyFish browser agents dispatched to all
  target sites concurrently (run-async)
  → each agent actively searches the site,
    navigates results, and identifies matches
        │
        ▼
  Matches mapped to structured infringement
  records with severity, source type, and
  system notes
        │
        ▼
  Report served to frontend
  + optional email notification sent
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js, Express |
| AI Analysis | OpenAI GPT-4o |
| Web Scraping | TinyFish browser automation (run-async) |
| Database | PostgreSQL |
| Email | Nodemailer |
| PDF Export | PDFKit |

---

## Project Structure

```
tinyfishHack/
├── frontend/                  # Next.js app
│   ├── app/
│   │   ├── page.tsx           # Landing page + investigation form
│   │   ├── scan/[id]/page.tsx # Live scan dashboard (polls every 3s)
│   │   └── report/[id]/page.tsx # Infringement report
│   ├── components/
│   │   ├── landing/           # Hero, form, architecture diagram
│   │   ├── scan/              # TerminalLog, DataStream
│   │   └── report/            # InfringementCard, filters, panel
│   └── lib/api.ts             # Typed API client
│
└── backend/                   # Express server
    └── src/
        ├── server.js          # Entry point, CORS, routes
        ├── store.js           # PostgreSQL data layer
        ├── routes/
        │   ├── investigations.js
        │   ├── scans.js
        │   ├── reports.js
        │   └── infringements.js
        └── services/
            ├── gemini.js      # GPT-4o asset analysis
            ├── tinyfish.js    # Bulk async browser scraping
            ├── scanner.js     # Main scan orchestrator
            └── email.js       # Completion notifications
```

---

## API Reference

### Investigations
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/investigations` | Start a new scan. Returns `{ scanId }` |

**Request body:**
```json
{
  "assetType": "patent | trademark | copyright | product",
  "assetName": "My Patent Name",
  "primaryUrl": "https://example.com",
  "email": "notify@example.com",
  "fileName": "reference.pdf"
}
```

### Scans
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/scans/:id` | Poll scan status, logs, and live stream |
| `POST` | `/api/scans/:id/pause` | Pause a running scan |
| `POST` | `/api/scans/:id/resume` | Resume a paused scan |

**Scan status response:**
```json
{
  "id": "uuid",
  "assetName": "My Patent",
  "assetType": "patent",
  "status": "queued | scanning | paused | complete",
  "progressPercent": 75,
  "startedAt": "2026-03-28T05:00:00Z",
  "logs": [{ "timestamp": "...", "level": "INFO | SCAN | ALERT | DATA", "message": "..." }],
  "stream": [{ "action": "MATCH_DETECTED", "url": "...", "elapsed": "1200ms", "tags": ["CRITICAL", "E_COMMERCE"], "isAlert": true }]
}
```

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reports/:scanId` | Get the full infringement report |
| `POST` | `/api/reports/:scanId/export` | Get a download URL for the report |
| `GET` | `/api/reports/:scanId/download` | Download the report as JSON |
| `POST` | `/api/reports/:scanId/mark-reviewed` | Mark all items as reviewed |

**Report response:**
```json
{
  "scanId": "uuid",
  "totalMatches": 3,
  "infringements": [
    {
      "id": "uuid",
      "domain": "aliexpress.com",
      "matchPercent": 87,
      "severity": "CRITICAL | MODERATE | OBSERVATIONAL",
      "tags": ["Replicates core claim", "Identical design"],
      "sourceType": "E_COMMERCE | SOCIAL_MEDIA | DOMAIN_SQUATTING | NFT_CRYPTO",
      "status": "UNACTIONED | PENDING_REVIEW | CEASE_AND_DESIST_SENT | LITIGATION",
      "systemNote": "Product replicates key feature #2..."
    }
  ]
}
```

### Infringements
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/infringements/:id/cease-and-desist` | Draft a C&D notice. Returns `{ documentId }` |
| `GET` | `/api/infringements/:id/trace` | Get a direct link to the infringing page |

---

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- OpenAI API key — [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- TinyFish API key — [tinyfish.ai](https://tinyfish.ai)

### Backend

```bash
cd backend
cp .env.example .env
# Fill in your API keys and database URL in .env
npm install
npm run dev
```

**`.env` variables:**
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

TINYFISH_API_KEY=sk-tinyfish-...
TINYFISH_POLL_INTERVAL=5000    # ms between status polls (default 5000)
TINYFISH_TIMEOUT=600000        # max wait per job in ms (default 10 min)

DATABASE_URL=postgresql://user:password@localhost:5432/ipguardian

PORT=4000
FRONTEND_ORIGIN=http://localhost:3000,http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

By default the frontend expects the backend at `http://localhost:4000`. Override with:
```env
# frontend/.env.local
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com
```

---

## Scan Pipeline Detail

### Phase 1 — GPT-4o Asset Analysis
GPT-4o receives the asset type, name, URL, and filename. It returns:
- A detailed description of the asset
- Up to 8 key features or claims
- Up to 10 search keywords
- 3–12 target websites ranked by infringement likelihood, each with a category (`E_COMMERCE`, `SOCIAL_MEDIA`, `DOMAIN_SQUATTING`, `NFT_CRYPTO`, `PATENT_DATABASE`, `MARKETPLACE`)

Rate limiting: 3 retries with 10s/20s backoff on 429s.

### Phase 2 — TinyFish Bulk Scraping
All target websites are submitted **simultaneously** via `POST /v1/automation/run-async`, which returns a `run_id` immediately. All jobs are then polled **in parallel** via `GET /v1/runs/{run_id}` every 5 seconds.

Total scan time ≈ the slowest single site (not the sum of all sites).

Each browser agent is instructed to:
1. Use the site's search bar with the asset's keywords
2. Browse at least two pages of results
3. Open and inspect any related listings
4. Flag matches if **any single key feature** is replicated — even partially

### Phase 3 — Report Assembly
TinyFish match objects are mapped to the frontend's `Infringement` schema:

| TinyFish field | Frontend field |
|---|---|
| `risk_level: HIGH` | `severity: CRITICAL` |
| `risk_level: MEDIUM` | `severity: MODERATE` |
| `risk_level: LOW` | `severity: OBSERVATIONAL` |
| `similarity_score` | `matchPercent` (80–95% / 55–74% / 32–54%) |
| URL pattern | `sourceType` (E_COMMERCE, SOCIAL_MEDIA, etc.) |

---

## Frontend Pages

### `/` — Investigation Form
Select asset type (Trademark, Copyright, Product, Patent), enter asset name and primary URL, optionally provide an email for completion notification and a reference file. Submits to the backend and redirects to the scan page.

### `/scan/[id]` — Live Scan Dashboard
Polls `/api/scans/:id` every 3 seconds. Shows:
- Real-time terminal log with colour-coded levels (INFO, SCAN, ALERT, DATA)
- Live data stream cards for each agent action
- Scan progress bar
- Auto-stops polling when `status === "complete"`

### `/report/[id]` — Infringement Report
Displays all detected infringements with:
- Filter sidebar (by severity, source type, status)
- Infringement cards showing domain, match %, severity badge, matched features, and system notes
- Per-item actions: Draft Cease & Desist, View Full Trace
- Export PDF and Mark All Reviewed bulk actions
