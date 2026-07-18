import argparse

import structlog

from charitymap_importer.config import get_settings
from charitymap_importer.pipeline import process_candidates
from charitymap_importer.sources.demo import load_demo_candidates


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

    result = process_candidates(load_demo_candidates(), dry_run=dry_run)
    structlog.get_logger().info(
        "import_complete",
        candidates=result.candidates,
        accepted=result.accepted,
        rejected=result.rejected,
        dry_run=result.dry_run,
    )


if __name__ == "__main__":
    main()
