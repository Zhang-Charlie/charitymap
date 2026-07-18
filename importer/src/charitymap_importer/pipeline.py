from dataclasses import dataclass

import structlog

from charitymap_importer.models import FundingEventCandidate

logger = structlog.get_logger()


@dataclass(frozen=True)
class ImportResult:
    candidates: int
    accepted: int
    rejected: int
    dry_run: bool


def process_candidates(
    candidates: list[FundingEventCandidate],
    *,
    dry_run: bool,
    rejected: int = 0,
) -> ImportResult:
    for candidate in candidates:
        logger.info(
            "funding_candidate_validated",
            funder=candidate.funder.name,
            status=candidate.status,
            dry_run=dry_run,
        )

    return ImportResult(
        candidates=len(candidates) + rejected,
        accepted=len(candidates),
        rejected=rejected,
        dry_run=dry_run,
    )
