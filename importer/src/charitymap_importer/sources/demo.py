from datetime import UTC, datetime
from decimal import Decimal

from pydantic import HttpUrl

from charitymap_importer.models import (
    FundingEventCandidate,
    FundingStatus,
    LocationCandidate,
    LocationPrecision,
    OrganisationReference,
    SourceReference,
)


def load_demo_candidates() -> list[FundingEventCandidate]:
    return [
        FundingEventCandidate(
            event_identifier="demo-1",
            headline="Education grant reported",
            funder=OrganisationReference(name="Example Foundation"),
            recipient=OrganisationReference(name="Learning Partnership"),
            source=SourceReference(
                publisher="CharityMap demonstration fixture",
                url=HttpUrl("https://example.org/funding/demo-1"),
                external_identifier="demo-1",
                published_at=datetime(2026, 7, 18, tzinfo=UTC),
            ),
            funding_type="grant",
            status=FundingStatus.COMMITTED,
            original_amount=Decimal("2400000.00"),
            original_currency="EUR",
            location=LocationCandidate(
                country_code="KE",
                name="Kenya",
                precision=LocationPrecision.COUNTRY,
            ),
        )
    ]
