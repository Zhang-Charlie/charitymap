alter type public.funding_status add value if not exists 'disbursed';
alter type public.funding_status add value if not exists 'reported_spend';

alter table public.funding_events
  add column source_event_identifier text,
  add column source_record_hash text;

update public.funding_events
set source_event_identifier = concat('legacy:', id::text)
where source_event_identifier is null;

alter table public.funding_events
  alter column source_event_identifier set not null;

create unique index funding_events_source_event_unique
  on public.funding_events (source_id, source_event_identifier);

alter table public.locations
  add column source_id uuid references public.sources(id) on delete set null,
  add column source_location_identifier text;

create unique index locations_source_location_unique
  on public.locations (source_id, source_location_identifier)
  where source_id is not null and source_location_identifier is not null;

create table public.raw_import_records (
  id uuid primary key default gen_random_uuid(),
  import_run_id uuid not null references public.import_runs(id) on delete cascade,
  source_record_identifier text not null,
  payload jsonb not null,
  payload_hash text not null,
  parse_status text not null check (parse_status in ('accepted', 'rejected')),
  rejection_reason text,
  retrieved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (import_run_id, source_record_identifier)
);

create index raw_import_records_import_run_idx
  on public.raw_import_records (import_run_id);

alter table public.raw_import_records enable row level security;

create or replace view public.approved_funding_event_summaries
with (security_invoker = true)
as
select
  event.id,
  coalesce(project.title, event.funding_type) as headline,
  funder.canonical_name::text as funder_name,
  recipient.canonical_name::text as recipient_name,
  event.original_amount,
  event.original_currency,
  event.status::text as status,
  event.event_date,
  event.source_published_at,
  project.sector_code,
  location.name as location_name,
  location.country_code::text as country_code,
  location.precision::text as location_precision,
  case when location.point is null then null else st_y(location.point::geometry) end as latitude,
  case when location.point is null then null else st_x(location.point::geometry) end as longitude,
  source.publisher as source_publisher,
  source.source_url
from public.funding_events event
join public.organisations funder on funder.id = event.funder_id
left join public.organisations recipient on recipient.id = event.recipient_id
left join public.projects project on project.id = event.project_id
left join public.locations location on location.id = event.location_id
join public.sources source on source.id = event.source_id
where event.verification_status = 'approved'
  and event.published_at is not null;

grant select on public.approved_funding_event_summaries to anon, authenticated;
