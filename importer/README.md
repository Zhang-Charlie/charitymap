# CharityMap importer

This package retrieves, validates and normalises IATI transaction records before they enter CharityMap.

The first source is the IATI Datastore transaction endpoint. It needs an IATI API subscription key and one reporting-organisation reference. The importer accepts only outgoing commitments, disbursements, and expenditures, and maps them to separate CharityMap stages.

Configure values in the repository-root `.env` file:

```bash
IATI_API_KEY=...
IATI_PUBLISHER_REF=...
IATI_MAX_RECORDS=100
IMPORT_WRITE_ENABLED=false
```

Validate a capped response without writing to the database:

```bash
uv sync
uv run charitymap-import --dry-run
```

Set `IMPORT_WRITE_ENABLED=true` only after the local database is available. Writes create `candidate` funding events and open review items; they never publish data automatically.

See [`docs/IATI_IMPORT.md`](../docs/IATI_IMPORT.md) for local setup and the manual review workflow.
