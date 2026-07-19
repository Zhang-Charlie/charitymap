from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime
from decimal import Decimal, InvalidOperation
from hashlib import sha256
from json import dumps
from typing import Final
from urllib.parse import quote

import httpx
from pydantic import HttpUrl, ValidationError

from charitymap_importer.models import (
    FundingEventCandidate,
    FundingStatus,
    LocationCandidate,
    LocationPrecision,
    OrganisationReference,
    SourceReference,
)

IATI_DATASTORE_URL: Final = "https://api.iatistandard.org/datastore/transaction/select"
IATI_ACTIVITY_URL: Final = "https://d-portal.org/ctrack.html#view=act&aid="
SUPPORTED_TRANSACTION_TYPES: Final = {
    "2": FundingStatus.COMMITTED,
    "3": FundingStatus.DISBURSED,
    "4": FundingStatus.REPORTED_SPEND,
}
SUPPORTED_TRANSACTION_QUERY: Final = "transaction_transaction_type_code:(2 OR 3 OR 4)"
REQUIRED_FUNDER_QUERY: Final = "transaction_provider_org_narrative:[* TO *]"
REQUESTED_FIELDS: Final = (
    "iati_identifier,title_narrative,reporting_org_ref,reporting_org_narrative,"
    "last_updated_datetime,transaction_ref,transaction_transaction_type_code,"
    "transaction_type_code,transaction_value,transaction_value_currency,"
    "transaction_value_value_date,transaction_transaction_date_iso_date,"
    "transaction_provider_org_ref,transaction_provider_org_narrative,"
    "transaction_receiver_org_ref,transaction_receiver_org_narrative,"
    "transaction_recipient_country_code,recipient_country_code,"
    "transaction_location_point_pos,location_point_pos,"
    "transaction_sector_code,sector_code"
)


@dataclass(frozen=True)
class IatiTransactionRecord:
    candidate: FundingEventCandidate
    payload: dict[str, object]
    payload_hash: str


@dataclass(frozen=True)
class RejectedIatiRecord:
    source_record_identifier: str
    payload: dict[str, object]
    payload_hash: str
    reason: str


@dataclass(frozen=True)
class IatiImportBatch:
    accepted: list[IatiTransactionRecord]
    rejected: list[RejectedIatiRecord]


class IatiDatastoreClient:
    def __init__(
        self,
        *,
        api_key: str,
        publisher_ref: str,
        max_records: int,
        timeout_seconds: float,
        base_url: str = IATI_DATASTORE_URL,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        self._api_key = api_key
        self._publisher_ref = publisher_ref
        self._max_records = max_records
        self._timeout_seconds = timeout_seconds
        self._base_url = base_url
        self._transport = transport

    def fetch(self) -> IatiImportBatch:
        response = self._request()
        documents = _documents_from_response(response)
        accepted: list[IatiTransactionRecord] = []
        rejected: list[RejectedIatiRecord] = []
        identifier_counts: dict[str, int] = {}

        for document in documents:
            if len(accepted) >= self._max_records:
                break
            payload = dict(document)
            payload_hash = _payload_hash(payload)
            identifier = _record_identifier(payload, payload_hash)
            occurrence = identifier_counts.get(identifier, 0)
            identifier_counts[identifier] = occurrence + 1
            if occurrence > 0:
                rejected.append(
                    RejectedIatiRecord(
                        source_record_identifier=(
                            f"{identifier}:duplicate:{occurrence}:{payload_hash[:16]}"
                        ),
                        payload=payload,
                        payload_hash=payload_hash,
                        reason="duplicate source transaction identifier",
                    )
                )
                continue
            try:
                accepted.append(_to_transaction_record(payload, payload_hash))
            except ValueError as error:
                rejected.append(
                    RejectedIatiRecord(
                        source_record_identifier=identifier,
                        payload=payload,
                        payload_hash=payload_hash,
                        reason=str(error),
                    )
                )

        return IatiImportBatch(accepted=accepted, rejected=rejected)

    def _request(self) -> dict[str, object]:
        headers = {
            "Ocp-Apim-Subscription-Key": self._api_key,
            "User-Agent": "CharityMap importer/0.1 (+https://github.com/Zhang-Charlie/charitymap)",
        }
        params = {
            "q": (
                f"reporting_org_ref:{_escape_solr_value(self._publisher_ref)} "
                f"AND {SUPPORTED_TRANSACTION_QUERY} AND {REQUIRED_FUNDER_QUERY}"
            ),
            "rows": str(self._max_records),
            "start": "0",
            "wt": "json",
            "fl": REQUESTED_FIELDS,
        }
        timeout = httpx.Timeout(self._timeout_seconds)
        last_error: httpx.HTTPError | None = None

        with httpx.Client(timeout=timeout, transport=self._transport) as client:
            for attempt in range(3):
                try:
                    response = client.get(self._base_url, params=params, headers=headers)
                    response.raise_for_status()
                    payload = response.json()
                    if not isinstance(payload, dict):
                        raise ValueError("IATI Datastore returned a non-object JSON response")
                    return payload
                except httpx.HTTPError as error:
                    last_error = error
                    if attempt == 2:
                        break

        raise RuntimeError("IATI Datastore request failed after 3 attempts") from last_error


def _documents_from_response(payload: dict[str, object]) -> list[dict[str, object]]:
    response = payload.get("response")
    if not isinstance(response, dict):
        raise ValueError("IATI Datastore response did not contain a response object")
    documents = response.get("docs")
    if not isinstance(documents, list):
        raise ValueError("IATI Datastore response did not contain transaction documents")
    return [document for document in documents if isinstance(document, dict)]


def _to_transaction_record(payload: dict[str, object], payload_hash: str) -> IatiTransactionRecord:
    transaction_type = _first_text(
        payload,
        "transaction_transaction_type_code",
        "transaction_type_code",
    )
    if transaction_type is None:
        raise ValueError("missing IATI transaction type")
    status = SUPPORTED_TRANSACTION_TYPES.get(transaction_type)
    if status is None:
        raise ValueError("unsupported IATI transaction type")

    activity_identifier = _required_text(payload, "iati_identifier")
    funder_name = _first_text(payload, "transaction_provider_org_narrative")
    if funder_name is None:
        raise ValueError("missing transaction provider organisation")

    amount = _decimal_from_payload(payload)
    currency = _required_text(payload, "transaction_value_currency").upper()
    event_identifier = _record_identifier(payload, payload_hash)
    reported_at = _datetime_from_payload(payload, "last_updated_datetime")
    event_date = _date_from_payload(
        payload,
        "transaction_transaction_date_iso_date",
        "transaction_value_value_date",
    )
    location = _location_from_payload(payload)
    title = _first_text(payload, "title_narrative")
    headline = title or f"IATI {status.value.replace('_', ' ')} transaction"

    try:
        candidate = FundingEventCandidate(
            event_identifier=event_identifier,
            headline=headline,
            funder=OrganisationReference(
                name=funder_name,
                external_identifier=_first_text(payload, "transaction_provider_org_ref"),
            ),
            recipient=_organisation_from_payload(
                payload,
                name_field="transaction_receiver_org_narrative",
                identifier_field="transaction_receiver_org_ref",
            ),
            source=SourceReference(
                publisher="IATI",
                url=HttpUrl(f"{IATI_ACTIVITY_URL}{quote(activity_identifier, safe='')}"),
                external_identifier=activity_identifier,
                published_at=reported_at,
            ),
            project_identifier=activity_identifier,
            sector_code=_first_text(payload, "transaction_sector_code", "sector_code"),
            funding_type="iati_transaction",
            status=status,
            original_amount=amount,
            original_currency=currency,
            event_date=event_date,
            location=location,
        )
    except ValidationError as error:
        raise ValueError(f"invalid IATI transaction: {error.errors()[0]['msg']}") from error

    return IatiTransactionRecord(candidate=candidate, payload=payload, payload_hash=payload_hash)


def _organisation_from_payload(
    payload: dict[str, object], *, name_field: str, identifier_field: str
) -> OrganisationReference | None:
    name = _first_text(payload, name_field)
    if name is None:
        return None
    return OrganisationReference(
        name=name,
        external_identifier=_first_text(payload, identifier_field),
    )


def _location_from_payload(payload: dict[str, object]) -> LocationCandidate:
    country_code = _first_text(
        payload,
        "transaction_recipient_country_code",
        "recipient_country_code",
    )
    latitude, longitude = _coordinates_from_payload(payload)
    precision = (
        LocationPrecision.EXACT
        if latitude is not None
        else (LocationPrecision.COUNTRY if country_code is not None else LocationPrecision.UNKNOWN)
    )
    return LocationCandidate(
        country_code=country_code.upper() if country_code is not None else None,
        latitude=latitude,
        longitude=longitude,
        precision=precision,
    )


def _coordinates_from_payload(payload: dict[str, object]) -> tuple[float | None, float | None]:
    position = _first_text(payload, "transaction_location_point_pos", "location_point_pos")
    if position is None:
        return None, None
    parts = position.replace(",", " ").split()
    if len(parts) != 2:
        return None, None
    try:
        latitude, longitude = (float(part) for part in parts)
    except ValueError:
        return None, None
    if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
        return None, None
    return latitude, longitude


def _decimal_from_payload(payload: dict[str, object]) -> Decimal:
    value = _required_text(payload, "transaction_value")
    try:
        amount = Decimal(value)
    except InvalidOperation as error:
        raise ValueError("invalid transaction value") from error
    if amount < 0:
        raise ValueError("transaction value cannot be negative")
    return amount


def _date_from_payload(payload: dict[str, object], *fields: str) -> date | None:
    value = _first_text(payload, *fields)
    if value is None:
        return None
    try:
        return date.fromisoformat(value[:10])
    except ValueError:
        return None


def _datetime_from_payload(payload: dict[str, object], field: str) -> datetime | None:
    value = _first_text(payload, field)
    if value is None:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo is not None else parsed.replace(tzinfo=UTC)


def _required_text(payload: dict[str, object], field: str) -> str:
    value = _first_text(payload, field)
    if value is None:
        raise ValueError(f"missing {field}")
    return value


def _first_text(payload: dict[str, object], *fields: str) -> str | None:
    for field in fields:
        value = payload.get(field)
        if isinstance(value, list):
            value = value[0] if value else None
        if isinstance(value, (str, int, float, Decimal)):
            text = str(value).strip()
            if text:
                return text
    return None


def _record_identifier(payload: dict[str, object], payload_hash: str) -> str:
    activity_identifier = _first_text(payload, "iati_identifier") or "unknown-activity"
    transaction_ref = _first_text(payload, "transaction_ref")
    return transaction_ref or f"{activity_identifier}:sha256:{payload_hash[:16]}"


def _payload_hash(payload: dict[str, object]) -> str:
    serialized = dumps(payload, sort_keys=True, separators=(",", ":"), default=str)
    return sha256(serialized.encode("utf-8")).hexdigest()


def _escape_solr_value(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')
