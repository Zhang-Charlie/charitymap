from __future__ import annotations

import httpx

from charitymap_importer.models import FundingStatus, LocationPrecision
from charitymap_importer.sources.iati import IatiDatastoreClient


def response_for(documents: list[dict[str, object]]) -> httpx.MockTransport:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["Ocp-Apim-Subscription-Key"] == "test-key"
        assert request.url.params["rows"] in {"1", "2"}
        assert request.url.params["q"] == (
            "reporting_org_ref:GB-TEST AND transaction_transaction_type_code:(2 OR 3 OR 4) "
            "AND transaction_provider_org_narrative:[* TO *]"
        )
        return httpx.Response(200, json={"response": {"docs": documents}})

    return httpx.MockTransport(handler)


def valid_transaction(*, transaction_type: str = "3") -> dict[str, object]:
    return {
        "iati_identifier": "GB-TEST-123",
        "title_narrative": ["Safe water programme"],
        "transaction_ref": "transaction-1",
        "transaction_transaction_type_code": transaction_type,
        "transaction_value": "1250.50",
        "transaction_value_currency": "usd",
        "transaction_transaction_date_iso_date": "2026-01-15",
        "last_updated_datetime": "2026-02-01T10:00:00Z",
        "transaction_provider_org_narrative": "Example Funder",
        "transaction_provider_org_ref": "GB-FUNDER",
        "transaction_receiver_org_narrative": "Example Recipient",
        "transaction_receiver_org_ref": "GB-RECIPIENT",
        "transaction_recipient_country_code": "ke",
        "transaction_location_point_pos": "-1.286389 36.817223",
        "transaction_sector_code": "14020",
    }


def client_for(documents: list[dict[str, object]], *, max_records: int = 2) -> IatiDatastoreClient:
    return IatiDatastoreClient(
        api_key="test-key",
        publisher_ref="GB-TEST",
        max_records=max_records,
        timeout_seconds=1,
        transport=response_for(documents),
    )


def test_maps_disbursement_to_canonical_status_and_preserves_evidence() -> None:
    batch = client_for([valid_transaction()]).fetch()

    assert len(batch.accepted) == 1
    candidate = batch.accepted[0].candidate
    assert candidate.status is FundingStatus.DISBURSED
    assert candidate.original_currency == "USD"
    assert candidate.location.precision is LocationPrecision.EXACT
    assert candidate.location.latitude == -1.286389
    assert candidate.source.external_identifier == "GB-TEST-123"
    assert "d-portal.org" in str(candidate.source.url)


def test_maps_commitment_and_reported_spend_without_combining_stages() -> None:
    commitment = valid_transaction(transaction_type="2")
    expenditure = valid_transaction(transaction_type="4")
    expenditure["transaction_ref"] = "transaction-2"

    batch = client_for([commitment, expenditure]).fetch()

    assert [record.candidate.status for record in batch.accepted] == [
        FundingStatus.COMMITTED,
        FundingStatus.REPORTED_SPEND,
    ]


def test_rejects_transaction_without_a_provider_organisation() -> None:
    payload = valid_transaction()
    payload.pop("transaction_provider_org_narrative")

    batch = client_for([payload]).fetch()

    assert batch.accepted == []
    assert len(batch.rejected) == 1
    assert batch.rejected[0].reason == "missing transaction provider organisation"


def test_caps_import_to_configured_number_of_accepted_transactions() -> None:
    first = valid_transaction()
    second = valid_transaction()
    second["transaction_ref"] = "transaction-2"

    batch = client_for([first, second], max_records=1).fetch()

    assert len(batch.accepted) == 1
    assert batch.accepted[0].candidate.event_identifier == "transaction-1"


def test_rejects_duplicate_transaction_identifiers() -> None:
    batch = client_for([valid_transaction(), valid_transaction(), valid_transaction()]).fetch()

    assert len(batch.accepted) == 1
    assert len(batch.rejected) == 2
    duplicate_identifiers = sorted(record.source_record_identifier for record in batch.rejected)
    assert duplicate_identifiers[0].startswith("transaction-1:duplicate:1:")
    assert duplicate_identifiers[1].startswith("transaction-1:duplicate:2:")
    assert duplicate_identifiers[0].rsplit(":", 1)[1] == duplicate_identifiers[1].rsplit(":", 1)[1]
    assert all(
        record.reason == "duplicate source transaction identifier" for record in batch.rejected
    )
