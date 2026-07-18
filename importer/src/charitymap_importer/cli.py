import argparse

import structlog

from charitymap_importer.config import get_settings
from charitymap_importer.database import load_iati_batch
from charitymap_importer.pipeline import process_candidates
from charitymap_importer.sources.iati import IatiDatastoreClient


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run a CharityMap funding import")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate candidates without writing data",
    )
    return parser


def main() -> None:
    args = build_parser().parse_args()
    settings = get_settings()
    dry_run = args.dry_run or not settings.import_write_enabled
    api_key = (
        settings.iati_api_key.get_secret_value() if settings.iati_api_key is not None else None
    )
    if api_key is None or settings.iati_publisher_ref is None:
        raise SystemExit("IATI_API_KEY and IATI_PUBLISHER_REF must be configured before importing")

    batch = IatiDatastoreClient(
        api_key=api_key,
        publisher_ref=settings.iati_publisher_ref,
        max_records=settings.iati_max_records,
        timeout_seconds=settings.iati_timeout_seconds,
    ).fetch()

    result = process_candidates(
        [record.candidate for record in batch.accepted],
        dry_run=dry_run,
        rejected=len(batch.rejected),
    )
    load_result = None
    if not dry_run:
        if settings.database_url is None:
            raise SystemExit("DATABASE_URL must be configured when IMPORT_WRITE_ENABLED is true")
        load_result = load_iati_batch(
            settings.database_url,
            batch,
            publisher_ref=settings.iati_publisher_ref,
        )

    structlog.get_logger().info(
        "import_complete",
        candidates=result.candidates,
        accepted=result.accepted,
        rejected=result.rejected,
        dry_run=result.dry_run,
        created=load_result.created if load_result is not None else 0,
        updated=load_result.updated if load_result is not None else 0,
    )


if __name__ == "__main__":
    main()
