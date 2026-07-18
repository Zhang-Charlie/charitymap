from decimal import Decimal

import pytest
from pydantic import ValidationError

from charitymap_importer.models import (
    FundingEventCandidate,
    LocationCandidate,
    OrganisationReference,
    SourceReference,
)


def source() -> SourceReference:
    return SourceReference(
        publisher="Test publisher",
        url="https://example.org/source",
    )


def test_currency_is_normalised_to_uppercase() -> None:
    candidate = FundingEventCandidate(
        event_identifier="test-1",
        headline="Test event",
        funder=OrganisationReference(name="Funder"),
        source=source(),
        funding_type="grant",
        original_amount=Decimal("10.00"),
        original_currency="eur",
    )

    assert candidate.original_currency == "EUR"


def test_amount_requires_currency() -> None:
    with pytest.raises(ValidationError):
        FundingEventCandidate(
            event_identifier="test-1",
            headline="Test event",
            funder=OrganisationReference(name="Funder"),
            source=source(),
            funding_type="grant",
            original_amount=Decimal("10.00"),
        )


def test_location_requires_complete_coordinate_pair() -> None:
    with pytest.raises(ValidationError):
        LocationCandidate(latitude=53.3)
