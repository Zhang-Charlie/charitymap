create extension if not exists pgcrypto;
create extension if not exists postgis;
create extension if not exists citext;

create type public.organisation_type as enum (
  'company',
  'foundation',
  'government',
  'multilateral',
  'nonprofit',
  'university',
  'other'
);

create type public.funding_status as enum (
  'announced',
  'committed',
  'partially_disbursed',
  'fully_disbursed',
  'reported_expenditure',
  'cancelled',
  'unknown'
);

create type public.verification_status as enum (
  'candidate',
  'needs_review',
  'approved',
  'rejected'
);

create type public.location_precision as enum (
  'exact',
  'city',
  'region',
  'country',
  'unknown'
);

create type public.source_type as enum (
  'api',
  'dataset',
  'annual_report',
  'press_release',
  'webpage',
  'other'
);

create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  canonical_name citext not null,
  organisation_type public.organisation_type not null default 'other',
  headquarters_country_code char(2),
  website_url text,
  registration_authority text,
  registration_identifier text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (registration_authority, registration_identifier)
);

create unique index organisations_canonical_name_unique
  on public.organisations (canonical_name);

create table public.organisation_aliases (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  alias citext not null,
  source_name text,
  confidence numeric(4, 3) check (confidence between 0 and 1),
  created_at timestamptz not null default now(),
  unique (organisation_id, alias)
);

create index organisation_aliases_alias_idx
  on public.organisation_aliases (alias);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  source_type public.source_type not null,
  publisher text not null,
  source_url text not null,
  source_identifier text,
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  raw_object_path text,
  content_hash text,
  created_at timestamptz not null default now(),
  unique (publisher, source_identifier)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.sources(id) on delete set null,
  source_project_identifier text,
  title text not null,
  description text,
  sector_code text,
  status text,
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, source_project_identifier)
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text,
  country_code char(2),
  region_name text,
  precision public.location_precision not null default 'unknown',
  point geography(point, 4326),
  created_at timestamptz not null default now()
);

create index locations_point_gist_idx
  on public.locations using gist (point);

create table public.funding_events (
  id uuid primary key default gen_random_uuid(),
  funder_id uuid not null references public.organisations(id),
  recipient_id uuid references public.organisations(id),
  project_id uuid references public.projects(id) on delete set null,
  location_id uuid references public.locations(id) on delete set null,
  source_id uuid not null references public.sources(id),
  funding_type text not null,
  status public.funding_status not null default 'unknown',
  original_amount numeric(20, 2),
  original_currency char(3),
  normalised_amount_eur numeric(20, 2),
  conversion_metadata jsonb not null default '{}'::jsonb,
  event_date date,
  source_published_at timestamptz,
  imported_at timestamptz not null default now(),
  verification_status public.verification_status not null default 'candidate',
  verification_notes text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (original_amount is null and original_currency is null)
    or
    (original_amount is not null and original_currency is not null)
  ),
  check (
    published_at is null
    or verification_status = 'approved'
  )
);

create index funding_events_public_feed_idx
  on public.funding_events (published_at desc)
  where verification_status = 'approved' and published_at is not null;

create index funding_events_funder_idx on public.funding_events (funder_id);
create index funding_events_recipient_idx on public.funding_events (recipient_id);
create index funding_events_project_idx on public.funding_events (project_id);
create index funding_events_location_idx on public.funding_events (location_id);

create table public.import_runs (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'running',
  records_downloaded integer not null default 0,
  records_created integer not null default 0,
  records_updated integer not null default 0,
  records_rejected integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create table public.review_items (
  id uuid primary key default gen_random_uuid(),
  record_type text not null,
  record_id uuid not null,
  reason text not null,
  confidence numeric(4, 3) check (confidence between 0 and 1),
  status text not null default 'open',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.organisations enable row level security;
alter table public.organisation_aliases enable row level security;
alter table public.sources enable row level security;
alter table public.projects enable row level security;
alter table public.locations enable row level security;
alter table public.funding_events enable row level security;
alter table public.import_runs enable row level security;
alter table public.review_items enable row level security;

create policy "Public can read organisations"
  on public.organisations for select
  to anon, authenticated
  using (true);

create policy "Public can read organisation aliases"
  on public.organisation_aliases for select
  to anon, authenticated
  using (true);

create policy "Public can read sources"
  on public.sources for select
  to anon, authenticated
  using (true);

create policy "Public can read projects"
  on public.projects for select
  to anon, authenticated
  using (true);

create policy "Public can read locations"
  on public.locations for select
  to anon, authenticated
  using (true);

create policy "Public can read approved funding events"
  on public.funding_events for select
  to anon, authenticated
  using (
    verification_status = 'approved'
    and published_at is not null
  );

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organisations_set_updated_at
before update on public.organisations
for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger funding_events_set_updated_at
before update on public.funding_events
for each row execute function public.set_updated_at();
