# Project Instructions

## Overview

Build a review aggregation dashboard using Next.js, PostgreSQL, and a review ingestion service.

## Data Source

Use SCRAPINGDOG API as the upstream review provider.

The provider returns publicly available Amazon reviews associated with the configured product URLs.

Do not use mock review data unless explicitly required for testing.

## Architecture

Review Provider
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
- Deduplicate reviews using review ID.
- Store reviews in PostgreSQL.
- Frontend must consume only internal APIs.
- Handle provider failures gracefully.
- Keep provider implementation isolated from business logic.
- Use TypeScript throughout the project.
- Follow clean architecture and separation of concerns.

## Database

Store:
- review_id
- source
- product_id
- author
- rating
- title
- body
- review_date
- created_at
- updated_at

## Code Quality

- Avoid duplicated logic.
- Prefer small reusable modules.
- Use environment variables for secrets.
- Add proper error handling and logging.


