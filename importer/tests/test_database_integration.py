from __future__ import annotations

import os
from decimal import Decimal

import psycopg
import pytest
from psycopg.rows import dict_row

from charitymap_importer.database import load_iati_batch
from charitymap_importer.models import (
    FundingEventCandidate,
    FundingStatus,
    LocationCandidate,
    LocationPrecision,
    OrganisationReference,
    SourceReference,
)
from charitymap_importer.sources.iati import IatiImportBatch, IatiTransactionRecord

DATABASE_URL = os.getenv("CHARITYMAP_INTEGRATION_DATABASE_URL")
pytestmark = pytest.mark.skipif(
    DATABASE_URL is None,
    reason="set CHARITYMAP_INTEGRATION_DATABASE_URL to run database integration tests",
)


def test_candidate_requires_approval_before_public_visibility() -> None:
    assert DATABASE_URL is not None
    batch = IatiImportBatch(accepted=[integration_record()], rejected=[])

    first_result = load_iati_batch(DATABASE_URL, batch, publisher_ref="integration-test")
    second_result = load_iati_batch(DATABASE_URL, batch, publisher_ref="integration-test")

    assert first_result.created == 1
    assert second_result.created == 0
    assert second_result.updated == 0

    connection_url = DATABASE_URL.replace("postgresql+psycopg://", "postgresql://", 1)
    with (
        psycopg.connect(connection_url, row_factory=dict_row) as connection,
        connection.cursor() as cursor,
    ):
        cursor.execute(
            """
            select event.id, event.verification_status, review.status as review_status
            from public.funding_events event
            join public.sources source on source.id = event.source_id
            join public.review_items review on review.record_id = event.id
            where source.publisher = 'IATI' and source.source_identifier = 'GB-INTEGRATION-TEST'
            """
        )
        candidate = cursor.fetchone()
        assert candidate is not None
        assert candidate["verification_status"] == "candidate"
        assert candidate["review_status"] == "open"

        cursor.execute(
            "select count(*) as count from public.approved_funding_event_summaries where id = %s",
            (candidate["id"],),
        )
        assert cursor.fetchone()["count"] == 0

        cursor.execute(
            """
            update public.funding_events
            set verification_status = 'approved', published_at = now()
            where id = %s
            """,
            (candidate["id"],),
        )
        cursor.execute(
            "select count(*) as count from public.approved_funding_event_summaries where id = %s",
            (candidate["id"],),
        )
        assert cursor.fetchone()["count"] == 1


def integration_record() -> IatiTransactionRecord:
    candidate = FundingEventCandidate(
        event_identifier="integration-transaction-1",
        headline="IATI integration test transaction",
        funder=OrganisationReference(name="Integration Test Funder"),
        recipient=OrganisationReference(name="Integration Test Recipient"),
        source=SourceReference(
            publisher="IATI",
            url="https://example.org/iati/integration-test",
            external_identifier="GB-INTEGRATION-TEST",
        ),
        project_identifier="GB-INTEGRATION-TEST",
        funding_type="iati_transaction",
        status=FundingStatus.DISBURSED,
        original_amount=Decimal("100.00"),
        original_currency="USD",
        location=LocationCandidate(
            country_code="KE",
            latitude=-1.286389,
            longitude=36.817223,
            precision=LocationPrecision.EXACT,
        ),
    )
    return IatiTransactionRecord(
        candidate=candidate,
        payload={
            "iati_identifier": "GB-INTEGRATION-TEST",
            "transaction_ref": "integration-transaction-1",
        },
        payload_hash="integration-test-hash",
    )
