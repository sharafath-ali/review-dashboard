# The Review Dash

Internal dashboard for AliveCor KardiaMobile Amazon reviews.

## Stack

- **Next.js 15** (App Router, TypeScript)
- **PostgreSQL** — review storage, deduplication via `ON CONFLICT DO NOTHING`
- **Scrapingdog** — upstream review provider (public Amazon reviews)
- **Tailwind CSS** — styling

## Quick Start

### Option A — Docker (everything in one command)

```bash
# 1. Copy the env template and add your Scrapingdog API key
cp .env.example .env
# Edit .env and set SCRAPINGDOG_API_KEY=your_key_here

# 2. Start everything (PostgreSQL + Next.js app)
docker-compose up --build
```

Open [http://localhost:3000](http://localhost:3000) — the app and database start together.

> **First run:** Click **Fetch Reviews** in the dashboard to pull real Amazon reviews into the database.

---

### Option B — Local development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your SCRAPINGDOG_API_KEY and DATABASE_URL

# 3. Start PostgreSQL (Docker just for the DB)
docker-compose up postgres -d

# 4. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `SCRAPINGDOG_API_KEY` | ✅ | Your Scrapingdog API key |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `AMAZON_DOMAIN` | No | `in` for Amazon India (default) |
| `INGEST_SECRET` | No | Bearer token to protect `POST /api/ingest` |

## API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/reviews` | Returns paginated reviews from DB |
| `POST` | `/api/ingest` | Triggers a Scrapingdog fetch and upserts to DB |

### `GET /api/reviews` query params

| Param | Type | Description |
|---|---|---|
| `page` | number | Page number (default: 1) |
| `rating` | 1–5 | Filter by star rating |
| `search` | string | Full-text search in title/body/author |

## Architecture

```
Browser
  └─► GET /api/reviews          (reads from PostgreSQL)
  └─► POST /api/ingest          (triggers upstream fetch)

Ingest pipeline:
  ScrapingdogProvider
    └─► GET api.scrapingdog.com/amazon/product (per ASIN)
    └─► normalize() → canonical Review model
    └─► UPSERT into PostgreSQL (deduplicated by review_id)
```

Swapping the upstream provider only requires implementing `IReviewProvider` in `src/lib/providers/` — no other layer changes.

## Products tracked

| ASIN | Product |
|---|---|
| B07RQW6SD5 | KardiaMobile 6L |
| B01A4W8AUK | KardiaMobile 1-Lead |
| B09TQ3ZN8V | KardiaMobile Card |
