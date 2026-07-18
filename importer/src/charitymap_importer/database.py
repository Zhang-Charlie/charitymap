from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import cast

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from charitymap_importer.models import FundingEventCandidate
from charitymap_importer.sources.iati import IatiImportBatch, IatiTransactionRecord


@dataclass(frozen=True)
class LoadResult:
    created: int
    updated: int
    rejected: int


def load_iati_batch(database_url: str, batch: IatiImportBatch, *, publisher_ref: str) -> LoadResult:
    connection_url = database_url.replace("postgresql+psycopg://", "postgresql://", 1)
    downloaded = len(batch.accepted) + len(batch.rejected)
    with (
        psycopg.connect(connection_url, row_factory=dict_row) as connection,
        connection.cursor() as cursor,
    ):
        import_run_id = _start_import_run(cursor, publisher_ref, downloaded)
        for rejected in batch.rejected:
            cursor.execute(
                """
                insert into public.raw_import_records (
                  import_run_id, source_record_identifier, payload, payload_hash,
                  parse_status, rejection_reason
                ) values (%s, %s, %s, %s, 'rejected', %s)
                """,
                (
                    import_run_id,
                    rejected.source_record_identifier,
                    Jsonb(rejected.payload),
                    rejected.payload_hash,
                    rejected.reason,
                ),
            )

        created = 0
        updated = 0
        for record in batch.accepted:
            cursor.execute(
                """
                insert into public.raw_import_records (
                  import_run_id, source_record_identifier, payload, payload_hash, parse_status
                ) values (%s, %s, %s, %s, 'accepted')
                """,
                (
                    import_run_id,
                    record.candidate.event_identifier,
                    Jsonb(record.payload),
                    record.payload_hash,
                ),
            )
            was_created, was_updated = _upsert_record(cursor, record)
            created += int(was_created)
            updated += int(was_updated)

        cursor.execute(
            """
            update public.import_runs
            set completed_at = now(),
                status = 'completed',
                records_created = %s,
                records_updated = %s,
                records_rejected = %s
            where id = %s
            """,
            (created, updated, len(batch.rejected), import_run_id),
        )

    return LoadResult(created=created, updated=updated, rejected=len(batch.rejected))


def _start_import_run(
    cursor: psycopg.Cursor[dict[str, object]], publisher_ref: str, downloaded: int
) -> str:
    cursor.execute(
        """
        insert into public.import_runs (source_name, records_downloaded, metadata)
        values ('iati', %s, %s)
        returning id
        """,
        (
            downloaded,
            Jsonb(
                {
                    "publisher_ref": publisher_ref,
                    "retrieved_at": datetime.now(UTC).isoformat(),
                }
            ),
        ),
    )
    row = cursor.fetchone()
    if row is None:
        raise RuntimeError("failed to create IATI import run")
    return cast(str, row["id"])


def _upsert_record(
    cursor: psycopg.Cursor[dict[str, object]], record: IatiTransactionRecord
) -> tuple[bool, bool]:
    candidate = record.candidate
    source_id = _upsert_source(cursor, record)
    funder_id = _upsert_organisation(cursor, candidate.funder.name)
    recipient_id = None
    if candidate.recipient is not None:
        recipient_id = _upsert_organisation(cursor, candidate.recipient.name)
    project_id = _upsert_project(
        cursor,
        source_id,
        candidate.project_identifier,
        candidate.headline,
        candidate.sector_code,
    )
    location_id = _upsert_location(cursor, source_id, candidate)

    cursor.execute(
        """
        insert into public.funding_events (
          funder_id, recipient_id, project_id, location_id, source_id, source_event_identifier,
          source_record_hash, funding_type, status, original_amount, original_currency, event_date,
          source_published_at, verification_status, published_at
        ) values (
          %s, %s, %s, %s, %s, %s, %s, %s, %s::public.funding_status, %s, %s, %s, %s,
          'candidate', null
        )
        on conflict (source_id, source_event_identifier) do update
        set funder_id = excluded.funder_id,
            recipient_id = excluded.recipient_id,
            project_id = excluded.project_id,
            location_id = excluded.location_id,
            source_record_hash = excluded.source_record_hash,
            funding_type = excluded.funding_type,
            status = excluded.status,
            original_amount = excluded.original_amount,
            original_currency = excluded.original_currency,
            event_date = excluded.event_date,
            source_published_at = excluded.source_published_at,
            verification_status = 'candidate',
            published_at = null,
            verification_notes = null
        where public.funding_events.source_record_hash is distinct from excluded.source_record_hash
        returning id, (xmax = 0) as created
        """,
        (
            funder_id,
            recipient_id,
            project_id,
            location_id,
            source_id,
            candidate.event_identifier,
            record.payload_hash,
            candidate.funding_type,
            candidate.status.value,
            candidate.original_amount,
            candidate.original_currency,
            candidate.event_date,
            candidate.source.published_at,
        ),
    )
    event = cursor.fetchone()
    if event is None:
        cursor.execute(
            """
            select id from public.funding_events
            where source_id = %s and source_event_identifier = %s
            """,
            (source_id, candidate.event_identifier),
        )
        existing = cursor.fetchone()
        if existing is None:
            raise RuntimeError("failed to find unchanged IATI funding event")
        return False, False

    event_id = cast(str, event["id"])
    cursor.execute(
        """
        insert into public.review_items (record_type, record_id, reason, status)
        select 'funding_event', %s, 'IATI transaction requires evidence review', 'open'
        where not exists (
          select 1 from public.review_items
          where record_type = 'funding_event' and record_id = %s and status = 'open'
        )
        """,
        (event_id, event_id),
    )
    created = bool(event["created"])
    return created, not created


def _upsert_source(cursor: psycopg.Cursor[dict[str, object]], record: IatiTransactionRecord) -> str:
    source = record.candidate.source
    cursor.execute(
        """
        insert into public.sources (
          source_type, publisher, source_url, source_identifier, published_at,
          retrieved_at, content_hash
        ) values ('api', %s, %s, %s, %s, now(), %s)
        on conflict (publisher, source_identifier) do update
        set source_url = excluded.source_url,
            published_at = excluded.published_at,
            retrieved_at = excluded.retrieved_at,
            content_hash = excluded.content_hash
        returning id
        """,
        (
            source.publisher,
            str(source.url),
            source.external_identifier,
            source.published_at,
            record.payload_hash,
        ),
    )
    row = cursor.fetchone()
    if row is None:
        raise RuntimeError("failed to upsert IATI source")
    return cast(str, row["id"])


def _upsert_organisation(cursor: psycopg.Cursor[dict[str, object]], name: str) -> str:
    cursor.execute(
        """
        insert into public.organisations (canonical_name)
        values (%s)
        on conflict (canonical_name) do update set canonical_name = excluded.canonical_name
        returning id
        """,
        (name,),
    )
    row = cursor.fetchone()
    if row is None:
        raise RuntimeError("failed to upsert organisation")
    return cast(str, row["id"])


def _upsert_project(
    cursor: psycopg.Cursor[dict[str, object]],
    source_id: str,
    project_identifier: str | None,
    title: str,
    sector_code: str | None,
) -> str | None:
    if project_identifier is None:
        return None
    cursor.execute(
        """
        insert into public.projects (source_id, source_project_identifier, title, sector_code)
        values (%s, %s, %s, %s)
        on conflict (source_id, source_project_identifier) do update
        set title = excluded.title, sector_code = excluded.sector_code
        returning id
        """,
        (source_id, project_identifier, title, sector_code),
    )
    row = cursor.fetchone()
    if row is None:
        raise RuntimeError("failed to upsert project")
    return cast(str, row["id"])


def _upsert_location(
    cursor: psycopg.Cursor[dict[str, object]], source_id: str, record: FundingEventCandidate
) -> str:
    location = record.location
    has_coordinates = location.latitude is not None and location.longitude is not None
    cursor.execute(
        """
        insert into public.locations (
          source_id, source_location_identifier, country_code, name, precision, point
        ) values (
          %s, %s, %s, %s, %s::public.location_precision,
          case when %s then st_setsrid(st_makepoint(%s, %s), 4326)::geography else null end
        )
        on conflict (source_id, source_location_identifier) where source_id is not null
          and source_location_identifier is not null do update
        set country_code = excluded.country_code,
            name = excluded.name,
            precision = excluded.precision,
            point = excluded.point
        returning id
        """,
        (
            source_id,
            record.event_identifier,
            location.country_code,
            location.name,
            location.precision.value,
            has_coordinates,
            location.longitude,
            location.latitude,
        ),
    )
    row = cursor.fetchone()
    if row is None:
        raise RuntimeError("failed to upsert location")
    return cast(str, row["id"])
