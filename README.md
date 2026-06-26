# The Review Dash

An internal dashboard for AliveCor KardiaMobile reviews fetched dynamically from Amazon India.

This project is structured with the application code inside the `the-review-dash` subfolder. All command-line instructions should be executed from within `the-review-dash` folder.

---

## Tech Stack & Architecture

We use a modern, robust, and clean architecture stack:
1. **Next.js 15 (App Router & Turbopack)**: Responsive front-end dashboard and fast backend REST API endpoints.
2. **PostgreSQL**: Reliable persistent storage for reviews, utilizing custom indexes for fast sorting.
3. **Knex.js**: Clean SQL query building, migrations, and seeding support.
4. **Rainforest API**: High-fidelity, upstream Amazon review scraping provider.
5. **Tailwind CSS & shadcn/ui**: Modern, accessible, and responsive components for the dashboard user interface.

---

## Key Features

* **Offset-Based Pagination & Multi-Filtering**:
  * Offset-based pagination for performant review loading.
  * Filters for **Rating**, **Product (ASIN)**, **Source (e.g., amazon_in)**, and **Text search** (matching title, body, author).
* **Reusable `RainforestProvider` Class**:
  * Decoupled and reusable provider class that implements `IReviewProvider`, allowing easy instantiation and multiple reuses.
* **Rate-Limit & Timeout Resilience**:
  * 3-attempt request retry loop with linear backoff (sleeping for 1.5s, then 3.0s) to handle temporary provider rate limits or timeouts.
* **Bearer Token Authorization**: Every API endpoint is secured using `process.env.INGEST_SECRET` bearer validation.
* **Global Toast Notifications**: Unified green/red toast banners feedback status instantly for every client fetch request.
* **Structured JSON Logging**: Centralized logger class providing machine-readable logs across API routes, ingestion services, and provider fetch requests.

---

## Review Ingestion & Deduplication Logic

### Current Strategy
Every review is uniquely and deterministically identified using the canonical Amazon review ID (`id` from the Rainforest API payload, stored as `review_id` in the database). 
To keep the database synchronized with upstream updates (e.g., changes to helpful votes, ratings, or title edits):
- We execute an upsert operation using PostgreSQL:
  ```sql
  INSERT INTO reviews (...) VALUES (...)
  ON CONFLICT (review_id) DO UPDATE SET ...
  ```
- This prevents duplicate records while updating the database with fresh fields dynamically.

### Future Considerations (Multi-Vendor Scaling)
If the platform expands to track reviews from other e-commerce websites (e.g., Flipkart, eBay):
- The `review_id` alone might collide across different platforms.
- To prevent collisions, the deduplication model can be scaled to use a **compound key** consisting of `review_id` + `source` (e.g., `amazon.in` or `flipkart.com`).

---

## Setup & Quick Start

**1. Clone the repository and navigate to the application folder:**
```bash
git clone <repository_url>
cd reviewer/the-review-dash
```

**2. Configure your environment variables:**
* Copy the example `.env` template:
  ```bash
  cp .env.example .env
  ```
* Register at [Rainforest API](https://www.rainforestapi.com/) to get a free API key (comes with 100 free request credits).
* Open the `.env` file and configure the keys:
  * `RAINFOREST_API_KEY`: Set your Rainforest API key.
  * `INGEST_SECRET`: Set a shared bearer secret (e.g. `8251CDEE21734908E7BB1CB0`) to authenticate and protect all API routes.
  ```env
  RAINFOREST_API_KEY=your_rainforest_api_key
  INGEST_SECRET=your_shared_bearer_token
  ```

Select one of the following options to run the application:

### Option A — Full Docker Stack (Runs everything in Docker)
Perfect for a quick review or testing without local Node dependencies.

```bash
# Start all services (Next.js dashboard, PostgreSQL, and automatic migrations)
npm run docker:run
```
Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

---

### Option B — Hybrid / Local Development (Database in Docker, App locally)
Best for fast iteration, code editing, and hot-reload.

```bash
# 1. Install local dependencies
npm install

# 2. Set up local env variables
cp .env.example .env.local
# Set your RAINFOREST_API_KEY inside .env.local
# (DATABASE_URL defaults to the local Docker database port 5433)

# 3. Start the database in Docker and run migrations automatically
npm run docker:db

# 4. Start Next.js locally
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

---

## Useful Helper Commands

Execute these inside the `the-review-dash` folder:
- **Stop all Docker containers**: `npm run docker:down`
- **Clear Docker database volumes**: `docker compose down -v`
- **Run local database migrations**: `npm run migrate`
- **Format code**: `npm run format`