.PHONY: check frontend-check importer-check

check: frontend-check importer-check

frontend-check:
	cd frontend && npm run check

importer-check:
	cd importer && uv run ruff check . && uv run mypy src && uv run pytest
