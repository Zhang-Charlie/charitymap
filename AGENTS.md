# CharityMap agent instructions

## Mission

Build a trustworthy platform that visualises publicly reported funding relationships. Accuracy and source traceability are more important than feature speed.

## Current architecture

- `frontend/` contains the Next.js App Router application
- `importer/` contains Python ingestion and validation code
- `supabase/migrations/` is the database source of truth
- GitHub Actions runs checks and scheduled imports
- Vercel hosts the frontend and route handlers
- Supabase hosts PostgreSQL with PostGIS

Do not add FastAPI, Redis, Celery, a message broker or a custom multi-agent framework without an accepted architecture decision.

## Product invariants

- Every public funding event must retain an original source
- Never infer a missing amount, recipient, location or payment status
- Keep announced, committed, disbursed and spent amounts distinct
- A country-level location must not be displayed as an exact project coordinate
- Imported records are candidates until they pass validation and review
- Missing data must not be presented as evidence of misconduct
- Public copy should say `recently reported` unless the source is genuinely real time

## Development rules

- Read `PRODUCT_SPEC.md`, `ARCHITECTURE.md`, `DATA_MODEL.md` and `MILESTONES.md` before broad changes
- Keep tasks bounded to one milestone or subsystem
- Add tests for behavioural changes
- Run all relevant checks before finishing
- Do not commit secrets
- Do not deploy to production
- Do not change the database contract and its consumers in parallel without first documenting the contract
- Prefer deterministic parsing and validation before AI extraction

## Commands

Frontend:

```bash
cd frontend
npm run lint
npm run typecheck
npm run test
npm run build
```

Importer:

```bash
cd importer
uv run ruff check .
uv run mypy src
uv run pytest
```

Complete repository:

```bash
make check
```

## Next.js note

The nested `frontend/AGENTS.md` contains version-specific Next.js guidance. Follow it when changing frontend code.
