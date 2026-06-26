# The Review Dash

Internal dashboard for AliveCor KardiaMobile Amazon reviews.

## Stack

- **Next.js 15** (App Router, TypeScript)
- **PostgreSQL** — review storage, deduplication via `ON CONFLICT DO UPDATE`
- **Rainforest API** — upstream review provider (public Amazon reviews)
- **Tailwind CSS** — styling

## Quick Start

### Option A — Full Docker Stack (Runs everything in Docker)

Best for a quick preview or testing without setting up Node.js locally.

```bash
# 1. Clone the repository and navigate into the app folder
cd the-review-dash

# 2. Copy the environment template and set your RAINFOREST_API_KEY
cp .env.example .env
# Edit .env and configure:
# RAINFOREST_API_KEY=your_key_here

# 3. Start everything in Docker (PostgreSQL + Automatic Migrations + Next.js App)
npm run docker:run
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

---

### Option B — Hybrid / Local Development (Database in Docker, App running locally)

Best for developing, editing code, and fast hot-reloads.

```bash
# 1. Clone the repository and navigate into the app folder
cd the-review-dash

# 2. Install local dependencies
npm install

# 3. Set up local environment variables
cp .env.example .env.local
# Edit .env.local and configure:
# RAINFOREST_API_KEY=your_key_here
# (DATABASE_URL defaults to the local Docker database port 5433)

# 4. Start the database in Docker and automatically run migrations
npm run docker:db

# 5. Start the Next.js development server locally
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

---

### Environment variables

| Variable             | Required | Description                                |
| -------------------- | -------- | ------------------------------------------ |
| `RAINFOREST_API_KEY` | ✅       | Your Rainforest API key                    |
| `DATABASE_URL`       | ✅       | PostgreSQL connection string               |
| `INGEST_SECRET`      | No       | Bearer token to protect `POST /api/ingest` |

## API

| Method | Endpoint       | Description                                       |
| ------ | -------------- | ------------------------------------------------- |
| `GET`  | `/api/reviews` | Returns paginated reviews from DB                 |
| `POST` | `/api/ingest`  | Triggers a Rainforest API fetch and upserts to DB |

### `GET /api/reviews` query params

| Param    | Type   | Description                           |
| -------- | ------ | ------------------------------------- |
| `page`   | number | Page number (default: 1)              |
| `rating` | 1–5    | Filter by star rating                 |
| `search` | string | Full-text search in title/body/author |

## Architecture

```
Browser
  └─► GET /api/reviews          (reads from PostgreSQL)
  └─► POST /api/ingest          (triggers upstream fetch)

Ingest pipeline:
  RainforestProvider
    └─► GET api.rainforestapi.com/request (per ASIN)
    └─► normalize() → canonical Review model
    └─► UPSERT into PostgreSQL (deduplicated by review_id)
```

Swapping the upstream provider only requires implementing `IReviewProvider` in `src/lib/providers/` — no other layer changes.

## Products tracked

| ASIN       | Product             |
| ---------- | ------------------- |
| B07RQW6SD5 | KardiaMobile 6L     |
| B01A4W8AUK | KardiaMobile 1-Lead |
| B09TQ3ZN8V | KardiaMobile Card   |
