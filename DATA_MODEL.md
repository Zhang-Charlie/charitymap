# CharityMap data model

## Organisation

Represents a funder, recipient, implementing body, government, company, foundation, university or nonprofit.

Important fields:

- Canonical name
- Organisation type
- Headquarters country
- Website
- Registration authority and identifier
- Source metadata

An organisation may have several roles across different funding events.

## Organisation alias

Stores alternate names and identifiers used by different data sources. Aliases support deterministic and reviewed entity resolution.

## Source

Represents the evidence for a record. Sources retain the publisher, URL, external identifier, publication date and retrieval timestamp.

## Project

Represents the work being funded. Projects may have a source-specific identifier, title, description, dates, sector and status.

## Location

Stores a PostGIS point where available and always records location precision.

Precision values:

- exact
- city
- region
- country
- unknown

## Funding event

Represents a publicly reported flow or allocation between organisations.

Important fields:

- Funder
- Recipient
- Project
- Original amount and currency
- Optional normalised amount and conversion metadata
- Funding type
- Funding status
- Event date
- Publication date
- Location
- Source
- Verification status
- Publication timestamp

## Import run

Records each ingestion execution and its counts, timing and error state.

## Review item

Represents a candidate or conflict that requires a human decision.

## Data rules

- Original values are immutable evidence fields
- Currency conversions are derived fields with dated conversion metadata
- A source is mandatory for a public funding event
- Location precision is mandatory even when coordinates are absent
- Public records require `approved` verification status
