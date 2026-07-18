# Architecture decisions

## ADR-001 — Use Next.js route handlers for the MVP

Status: accepted

The first release will not run a separate FastAPI service. The public API is initially small, and Vercel can host the web application and route handlers together.

## ADR-002 — Use Python for ingestion

Status: accepted

Python is used for source adapters, parsing, validation and future unstructured-document processing.

## ADR-003 — Use PostgreSQL with PostGIS

Status: accepted

Funding records have geographic relationships. PostGIS gives the project a standard spatial model and avoids storing ad hoc latitude and longitude logic throughout the codebase.

## ADR-004 — Human approval before publication

Status: accepted

Imported and AI-assisted records remain candidates until validation and review requirements are satisfied.
