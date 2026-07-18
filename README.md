# CharityMap

CharityMap is a public-interest platform for exploring publicly reported funding between organisations, recipients, projects and locations around the world.

The first release uses a low-cost architecture:

- Next.js and TypeScript for the public application
- Python for scheduled data ingestion
- PostgreSQL with PostGIS for structured and geographic data
- Supabase for the hosted database
- Vercel for the public web application
- GitHub Actions for scheduled imports and continuous integration

## Repository layout

```text
charitymap/
├── frontend/              Next.js application and route handlers
├── importer/              Python ingestion and validation package
├── supabase/migrations/   Database schema and policies
├── docs/                  Product and technical decisions
├── .github/workflows/     Continuous integration and scheduled jobs
├── docker-compose.yml     Local PostGIS database
└── AGENTS.md              Instructions for Codex and other coding agents
```

## Requirements

- Node.js 22 or newer
- npm 10 or newer
- Python 3.13
- uv
- Docker or Podman for the optional local database

The frontend was generated with the current Next.js App Router template. The importer uses a `pyproject.toml` and a committed `uv.lock` for reproducible Python environments.

## Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Start the importer

```bash
cd importer
uv sync
uv run charitymap-import
```

The default importer runs in dry-run mode and writes nothing unless a database URL is provided and an explicit write mode is implemented for a source.

## Start local PostGIS

```bash
cp .env.example .env
docker compose up -d database
```

The database is available on `localhost:5432`. The initial migration is loaded when the volume is created for the first time.

## Validation commands

```bash
make check
```

Or run the checks separately:

```bash
cd frontend && npm run check
cd importer && uv run ruff check . && uv run mypy src && uv run pytest
```

## Deployment plan

1. Create a Supabase project and enable PostGIS through the migration
2. Apply the SQL migration in `supabase/migrations`
3. Add Supabase environment variables to Vercel
4. Import the `frontend` directory as the Vercel project root
5. Add the database secrets to GitHub Actions
6. Run the scheduled importer manually before enabling regular imports

Do not add FastAPI yet. Add a separate API service only after route handlers become a measurable constraint.

## Current scope

The repository provides the foundation rather than a finished funding platform. It includes:

- A responsive map and feed shell
- A health endpoint
- Shared domain terminology
- A normalised database schema
- A safe Python importer skeleton
- Automated checks
- A scheduled import workflow that exits safely when secrets are absent
- Product, architecture and milestone documentation

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
