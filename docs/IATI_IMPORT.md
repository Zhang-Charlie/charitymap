# IATI import and review

## Local setup

Copy the root environment template and add an IATI API subscription key plus one IATI reporting-organisation reference:

```bash
cp .env.example .env
docker compose up -d database
cd importer
uv sync
uv run charitymap-import --dry-run
```

The first data slice is deliberately capped at `IATI_MAX_RECORDS=100`. It imports only IATI transaction types 2 (outgoing commitment), 3 (disbursement), and 4 (expenditure). Original amounts and currencies are retained; CharityMap does not create exchange-rate conversions in this importer.

To write candidates locally, set `IMPORT_WRITE_ENABLED=true` in `.env` and run `uv run charitymap-import`. The importer stores the raw source payload, source metadata, candidate event, and an open review item in one database transaction.

For an existing local database, apply `supabase/migrations/202607190001_iati_imports.sql` before the first write. Fresh Docker volumes automatically load every migration in `supabase/migrations`.

## Review and publish

Review the candidate and evidence URL before publishing. Run the following as a trusted database administrator, replacing the event UUID after inspection:

```sql
begin;

select
  event.id,
  event.status,
  event.original_amount,
  event.original_currency,
  source.source_url,
  source.publisher
from public.funding_events event
join public.sources source on source.id = event.source_id
where event.verification_status = 'candidate'
order by event.imported_at desc;

update public.funding_events
set verification_status = 'approved',
    verification_notes = 'Evidence reviewed by authorised reviewer.',
    published_at = now()
where id = '<event-uuid>'
  and verification_status = 'candidate';

update public.review_items
set status = 'closed',
    reviewed_at = now()
where record_type = 'funding_event'
  and record_id = '<event-uuid>'
  and status = 'open';

commit;
```

Only approved events with `published_at` appear in the public Supabase view used by the frontend. A changed source payload resets that event to `candidate` and clears publication until it is reviewed again.
