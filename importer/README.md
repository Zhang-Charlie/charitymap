# CharityMap importer

This package retrieves, validates and normalises funding records before they enter CharityMap.

The current command is deliberately safe. It builds a demonstration candidate and performs validation. It does not write to a database.

```bash
uv sync
uv run charitymap-import --dry-run
```

Future source adapters live under `charitymap_importer/sources` and must preserve source identifiers and evidence URLs.
