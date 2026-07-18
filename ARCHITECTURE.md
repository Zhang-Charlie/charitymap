# CharityMap architecture

## MVP architecture

```text
Public data sources
        ↓
Scheduled Python importer in GitHub Actions
        ↓
Validation, normalisation and review state
        ↓
Supabase PostgreSQL with PostGIS
        ↓
Next.js route handlers
        ↓
Next.js interface with MapLibre
        ↓
Vercel
```

## Why this architecture

The MVP avoids an always-on Python server. This keeps hosting close to free while preserving Python for data ingestion, validation and future document processing.

## Components

### Frontend

The Next.js application provides:

- Public pages
- The map and feed interface
- Lightweight route handlers
- Server-side database queries
- Admin pages later

### Importer

The Python package provides:

- Source adapters
- Normalised candidate models
- Deterministic validation
- Organisation matching later
- Import-run reporting
- Database writes through a privileged server-side connection later

### Database

PostgreSQL stores normalised records. PostGIS stores geographic points and supports spatial filtering.

The SQL migration is the contract shared by frontend and importer code.

### Scheduled jobs

GitHub Actions runs the importer on a schedule. Scheduled workflows can be delayed, so imports must not be described as exact real-time processing.

## Security boundaries

- The browser may receive only the Supabase anonymous key
- The service-role key is restricted to trusted server and workflow environments
- Public reads are controlled through row-level security
- Writes occur only through trusted code
- Public events require approved verification status and a publication timestamp

## Evolution path

Add FastAPI only when one or more of these become true:

- Route handlers are difficult to maintain
- Several clients need the same API
- Complex PostGIS queries need a dedicated service
- Public API rate limiting is required
- Long-running requests cannot fit the serverless model

Add background workers only when scheduled batch jobs are no longer sufficient.
