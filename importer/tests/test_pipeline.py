from charitymap_importer.pipeline import process_candidates
from charitymap_importer.sources.demo import load_demo_candidates


def test_demo_candidate_is_accepted_in_dry_run() -> None:
    result = process_candidates(load_demo_candidates(), dry_run=True)

    assert result.candidates == 1
    assert result.accepted == 1
    assert result.rejected == 0
    assert result.dry_run is True
