from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, Field, HttpUrl, model_validator


class FundingStatus(StrEnum):
    ANNOUNCED = "announced"
    COMMITTED = "committed"
    PARTIALLY_DISBURSED = "partially_disbursed"
    FULLY_DISBURSED = "fully_disbursed"
    REPORTED_EXPENDITURE = "reported_expenditure"
    CANCELLED = "cancelled"
    UNKNOWN = "unknown"


class LocationPrecision(StrEnum):
    EXACT = "exact"
    CITY = "city"
    REGION = "region"
    COUNTRY = "country"
    UNKNOWN = "unknown"


class SourceReference(BaseModel):
    publisher: str = Field(min_length=1)
    url: HttpUrl
    external_identifier: str | None = None
    published_at: datetime | None = None


class OrganisationReference(BaseModel):
    name: str = Field(min_length=1)
    external_identifier: str | None = None


class LocationCandidate(BaseModel):
    country_code: str | None = Field(default=None, min_length=2, max_length=2)
    name: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    precision: LocationPrecision = LocationPrecision.UNKNOWN

    @model_validator(mode="after")
    def coordinates_are_complete(self) -> "LocationCandidate":
        has_latitude = self.latitude is not None
        has_longitude = self.longitude is not None
        if has_latitude != has_longitude:
            raise ValueError("Latitude and longitude must be supplied together")
        return self


class FundingEventCandidate(BaseModel):
    funder: OrganisationReference
    recipient: OrganisationReference | None = None
    source: SourceReference
    funding_type: str = Field(min_length=1)
    status: FundingStatus = FundingStatus.UNKNOWN
    original_amount: Decimal | None = Field(default=None, ge=0)
    original_currency: str | None = Field(default=None, min_length=3, max_length=3)
    event_date: date | None = None
    location: LocationCandidate = Field(default_factory=LocationCandidate)

    @model_validator(mode="after")
    def amount_and_currency_are_paired(self) -> "FundingEventCandidate":
        has_amount = self.original_amount is not None
        has_currency = self.original_currency is not None
        if has_amount != has_currency:
            raise ValueError("Amount and currency must be supplied together")
        if self.original_currency is not None:
            self.original_currency = self.original_currency.upper()
        return self
