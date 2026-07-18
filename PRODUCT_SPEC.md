# CharityMap product specification

## Problem

Funding information is spread across aid databases, grant portals, annual reports and announcements. The data is often difficult for the public to compare or understand.

## Product statement

CharityMap helps people explore publicly reported funding between organisations, recipients, projects and locations through an interactive world map and chronological activity feed.

## Primary users

- Members of the public researching where funding goes
- Funders and recipient organisations checking how public records represent them
- Researchers, students and journalists exploring funding patterns
- CharityMap reviewers validating imported records

## Core user journeys

1. Open the world map and inspect recently reported funding activity
2. Filter events by country, sector, organisation, date and funding status
3. Open a funding event and view the funder, recipient, amount, project and original source
4. Open an organisation profile and explore its reported funding relationships
5. Submit a correction with supporting evidence
6. Review an imported candidate before publication

## MVP features

- Responsive world map and activity feed
- Search for organisations, countries and projects
- Funding event detail pages
- Organisation profile pages
- Country filters
- Sector filters
- Funding-status filters
- Source links
- Methodology and correction pages
- One structured data importer
- Admin review queue

## Non-goals for the first release

- Tracking an individual donor's exact money
- Claiming complete global coverage
- Rating organisations as good or bad
- Real-time web scraping
- Public user accounts
- A native mobile application
- Multiple autonomous production agents
- Blockchain-based tracking

## Funding terminology

Use `funding event` as the general record. A funding event can represent:

- Donation
- Grant
- Commitment
- Disbursement
- Expenditure
- Sponsorship
- In-kind contribution
- Government aid
- Investment

Status must be explicit and must not be silently upgraded from announced to paid.

## Trust requirements

Every event page must show:

- Original source
- Source publisher
- Event or transaction date when available
- Publication date when available
- Import date
- Geographic precision
- Verification status
- Any important limitations
