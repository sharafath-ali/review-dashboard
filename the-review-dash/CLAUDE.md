# Project Instructions

## Overview

Build a review aggregation dashboard using Next.js, PostgreSQL, and a review ingestion service.

## Data Source

Use Rainforest API as the upstream review provider.

The provider returns publicly available Amazon reviews associated with the configured product ASINs.

Do not use mock review data unless explicitly required for testing.

## Architecture

Review Provider (Rainforest API)
↓
Review Ingestion Service
↓
PostgreSQL
↓
REST API
↓
Dashboard

## Requirements

- Normalize review data before persistence.
- Deduplicate reviews using Amazon's canonical review ID.
- Store reviews in PostgreSQL.
- Frontend must consume only internal APIs.
- Handle provider failures and rate-limits gracefully (with retry backoff).
- Keep provider implementation isolated from business logic.
- Use TypeScript throughout the project.
- Follow clean architecture and separation of concerns.

## Database

Store columns:

- id (primary key)
- review_id (canonical Amazon review ID, unique)
- asin
- product_name
- source (e.g. amazon_in)
- author
- rating
- title
- body
- reviewed_at (timestamp)
- ingested_at (timestamp)
- verified (boolean)
- helpful_count (integer)

## Code Quality

- Avoid duplicated logic.
- Prefer small reusable modules.
- Use environment variables for secrets.
- Add proper error handling and logging.
