# CharityMap Codex Instructions

## Project overview

CharityMap is a public-interest platform for mapping publicly reported funding flows between organisations.

The product is inspired by the map-and-feed structure of Liveuamap, but it focuses on funding rather than news or conflict events.

The platform should show:

* Funding organisations
* Recipient organisations
* Projects
* Countries and geographic locations
* Funding amounts and currencies
* Funding status
* Source records
* Recently reported funding activity
* Connections between funders, recipients, projects, and locations

CharityMap must be evidence-based. Every published funding event should be traceable to at least one public source.

The platform must not imply that it tracks every donation. It must not imply that it can trace an individual donor’s exact money unless the source explicitly provides that information.

## Core funding terminology

Funding stages must remain separate:

* `announced`
* `committed`
* `disbursed`
* `reported_spend`

Never combine these values into one total without clearly labelling what the total represents.

Do not describe announced or committed funding as money that has already been spent.

## Repository structure

Inspect the repository before changing anything.

Expected high-level structure:

* `frontend/` — Next.js web application
* `importer/` — Python data ingestion and normalisation
* `database/` or equivalent migration directory — PostgreSQL and PostGIS schema
* `docs/` — product, architecture, data model, and milestone documentation
* `.github/workflows/` — continuous integration and scheduled importer workflows

Read existing documentation before implementing features.

Important documentation may include:

* Product specification
* Architecture document
* Data model
* Milestones
* README files
* Existing nested `AGENTS.md` files

More specific instructions in nested `AGENTS.md` files override this root file for files within their scope.

## Current technology stack

### Frontend

* Next.js App Router
* TypeScript
* React
* Tailwind CSS
* MapLibre GL
* Supabase JavaScript client
* Zod
* Vitest
* Testing Library
* ESLint

### Data importer

* Python 3.13 where supported
* `uv` for dependency and environment management
* HTTPX for HTTP requests
* Pydantic for validation
* Pandas only when tabular transformation materially benefits from it
* Ruff for linting and formatting
* mypy for static type checking
* pytest for tests

### Database

* PostgreSQL
* PostGIS
* Supabase
* SQL migrations
* Row Level Security where appropriate

### Deployment

* Vercel for the frontend
* Supabase for PostgreSQL, PostGIS, and application data
* GitHub Actions for CI and scheduled imports
* Cloudflare R2 may later be used for raw source storage

Do not introduce paid infrastructure without explaining why it is necessary and obtaining approval.

## Development environment

The primary local environment is Fedora Linux.

The repository path is normally:

`~/Code/charitymap`

The frontend path is:

`~/Code/charitymap/frontend`

Do not assume macOS, Windows, WSL, or a container unless the current environment confirms it.

Do not use `sudo npm install`.

Do not modify global npm configuration unless necessary. Explain any global configuration change before applying it.

## Package registry rule

All committed npm lock-file package URLs must use the public npm registry or standard npm-compatible public package sources.

Do not commit references to private, temporary, inaccessible, or environment-specific package registries.

In particular, committed files must not contain:

`packages.applied-caas-gateway1.internal.api.openai.org`

Check for this before committing a regenerated lock file.

Useful check:

```bash
grep -R "applied-caas-gateway" frontend/package-lock.json
```

A successful check should produce no output.

## Working method

Before making changes:

1. Inspect the relevant files.
2. Read the relevant documentation.
3. Check `git status`.
4. Explain the observed problem or requested implementation.
5. Propose a short implementation plan.
6. Identify assumptions and risks.

Then make the smallest coherent change that solves the task.

Do not modify unrelated files.

Do not perform large refactors unless the task requires them.

Do not replace working code solely because another approach looks cleaner.

Preserve existing behaviour unless the requested change intentionally alters it.

## Git rules

Do not push directly to GitHub unless explicitly asked.

Do not create, delete, rename, or switch branches unless explicitly asked or clearly required by the task.

Do not amend, squash, rebase, reset, force-push, or rewrite history without explicit approval.

Do not discard uncommitted user changes.

Before changing files, run:

```bash
git status --short
```

After changing files, show:

```bash
git status --short
git diff --stat
git diff
```

Do not commit generated secrets, local environment files, build output, caches, or dependency directories.

Examples that must remain untracked:

* `.env`
* `.env.local`
* `node_modules/`
* `.next/`
* Python virtual environments
* Python cache directories
* coverage output
* editor-specific temporary files

## Secrets and security

Never expose, print, commit, or copy secrets.

Treat all of the following as sensitive:

* Supabase service-role keys
* Database passwords
* API keys
* Access tokens
* Private URLs containing credentials
* GitHub tokens
* Vercel tokens

Only public browser-safe values may use the `NEXT_PUBLIC_` prefix.

Never put a Supabase service-role key in frontend code.

Use `.env.example` for variable names and documentation, but never include real values.

Before proposing a commit, inspect the diff for secrets and private endpoints.

## Frontend conventions

Use TypeScript for application code.

Avoid `any`. When unavoidable, explain it and keep its scope narrow.

Prefer:

* Server Components by default
* Client Components only when browser APIs, interactive state, or hooks require them
* Small focused components
* Explicit prop types
* Accessible semantic HTML
* Clear loading, empty, and error states
* Responsive layouts
* Keyboard-accessible controls
* Stable list keys
* URL-based state for shareable filters where practical

Do not create unnecessary abstraction layers.

Do not add a state-management library unless existing React and URL state are clearly insufficient.

Do not fetch the same data independently in several components.

Avoid hydration mismatches.

Do not suppress TypeScript, React, ESLint, or Next.js warnings without identifying the root cause.

## UI direction

The interface should feel like a credible public-data platform.

Use:

* A map-and-feed layout
* Clear information hierarchy
* Readable data cards
* Restrained visual styling
* Responsive behaviour
* Visible source attribution
* Explicit funding status labels
* Clear filters
* Accessible contrast
* Consistent spacing
* Useful empty and failure states

Avoid:

* Misleading “live” claims
* Decorative complexity
* Excessive animation
* Unnecessary gradients
* Generic dashboard clutter
* Presenting estimates as confirmed facts

The map must remain usable if the map style or map provider is unavailable. Provide a clear fallback rather than an endless loading state.

## Map requirements

MapLibre should be loaded only in a browser-capable context.

Account for:

* Server-side rendering
* Dynamic import requirements
* Map container dimensions
* Missing style URL
* Style-loading errors
* Network failures
* Empty datasets
* Invalid coordinates
* Duplicate markers
* Marker clustering where dataset size requires it

Do not leave users with an indefinite loading indicator.

If a map cannot load, show a useful fallback that explains the problem while keeping the funding feed accessible.

## Data integrity

Every funding event should preserve source provenance.

Where available, preserve:

* Source system
* Source URL
* Source identifier
* Publisher
* Publication date
* Retrieval date
* Original currency
* Original amount
* Normalised amount
* Funding status
* Recipient
* Funder
* Project
* Country
* Coordinates
* Source document metadata

Do not silently overwrite source values with cleaned values.

Store original and normalised representations separately where useful.

Do not invent coordinates, amounts, organisations, countries, dates, or status values.

Use `null` for unknown values rather than fabricated defaults.

## Data-source strategy

<!-- The initial importer should prioritise IATI data. -->

Potential later sources include:

* OCHA Financial Tracking Service
* OECD development-finance data
* 360Giving
* European Union funding records
* Public foundation grant databases

Each source should have its own adapter or ingestion boundary.

Do not tightly couple source-specific fields to the canonical funding-event model.

## Importer architecture

Prefer a pipeline with explicit stages:

1. Fetch
2. Preserve raw source metadata
3. Parse
4. Validate
5. Normalise
6. Deduplicate
7. Transform into the canonical model
8. Load
9. Record import results and failures

Import jobs should be idempotent where possible.

One malformed record should not terminate an entire batch unless continuing would corrupt results.

Log rejected records with enough context to diagnose them, but do not log secrets.

Use deterministic identifiers or documented source keys for deduplication.

HTTP requests should include:

* A timeout
* Appropriate retry handling
* Clear user agent where required
* Status-code validation
* Rate-limit awareness

Tests must not depend on unstable live network services unless explicitly designated as integration tests.

## Database rules

Use migrations for schema changes.

Do not manually alter production tables as part of normal development.

Use appropriate:

* Primary keys
* Foreign keys
* Unique constraints
* Check constraints
* Indexes
* Timestamps
* PostGIS types and indexes
* Row Level Security policies

Do not use floating-point types for financial amounts.

Use a suitable exact numeric representation and preserve the original currency.

Schema changes should consider backward compatibility and migration safety.

## Source publication workflow

Imported data should not automatically become trusted public content without validation rules.

Keep a distinction between:

* Raw imported records
* Normalised records
* Rejected records
* Approved or publishable records

Source attribution must remain available on published records.

## Testing requirements

Run the narrowest relevant tests while developing.

Before declaring a frontend task complete, run as applicable:

```bash
cd frontend
npm run lint
npm run typecheck
npm run test
npm run build
```

The combined command may be:

```bash
npm run check
```

Before declaring a Python importer task complete, run the repository’s documented commands. Expected checks may include:

```bash
uv run ruff check .
uv run ruff format --check .
uv run mypy .
uv run pytest
```

Do not claim a test passed unless it was actually executed successfully.

If a command cannot be run, report:

* The exact command
* Why it could not run
* What was still verified
* What remains unverified

Do not fix unrelated failing tests without first identifying them as pre-existing.

## Dependency management

Before adding a dependency:

1. Check whether the existing stack can solve the problem.
2. Explain why the dependency is needed.
3. Prefer established, actively maintained packages.
4. Avoid overlapping libraries.
5. Consider bundle size, security, and maintenance cost.
6. Update the correct lock file.
7. Run the relevant tests and build.

Do not upgrade unrelated dependencies during a feature or bug-fix task.

## Error handling

Errors shown to users should be understandable and actionable.

Server logs may include technical context, but must not include secrets.

Do not swallow exceptions without handling or recording them.

Distinguish:

* User input errors
* Missing configuration
* Source-data validation errors
* Network failures
* Database failures
* Internal application failures

## Accessibility

For user-facing work:

* Use labels for controls
* Support keyboard navigation
* Preserve visible focus states
* Use buttons for actions and links for navigation
* Include accessible names for icon-only controls
* Do not communicate status using colour alone
* Respect reduced-motion preferences
* Keep contrast readable

## Performance

Avoid premature optimisation, but prevent obvious issues:

* Repeated full-dataset requests
* Unbounded map markers
* Large client-side bundles
* Repeated parsing in render paths
* Fetch loops
* Unnecessary client components
* Unoptimised images
* N+1 database queries

Measure or explain performance claims.

## Documentation

Update documentation when a change affects:

* Setup
* Environment variables
* Commands
* Architecture
* Data model
* Deployment
* Import behaviour
* User-visible terminology

Keep setup instructions valid for Fedora Linux.

## Completion report

At the end of a task, report:

1. What was changed
2. Why it was changed
3. Files changed
4. Commands run
5. Test and build results
6. Remaining risks or limitations
7. Suggested next step

Do not merely say that the task is complete.

## Current priority

The immediate priority is to establish a reliable local development environment.

Current known issue:

* `npm install` previously failed with `ENOTEMPTY`
* The dependency directory became partially installed
* `npm run dev` then failed because `next` was not present
* A generated lock file referenced an internal OpenAI package registry
* The lock file needs to be regenerated using the public npm registry
* Next.js must be installed and verified
* The frontend development server must start successfully
* The page must respond locally without an indefinite loading state

The current task should be completed before starting major product features.
