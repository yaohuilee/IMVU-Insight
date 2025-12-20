
# IMVU Insight Backend

A FastAPI backend service that parses IMVU XML exports, exposes analytics/metrics APIs, and connects to MySQL for persistence.

## Tech Stack

- FastAPI
- SQLAlchemy 2.x (Async) + MySQL (asyncmy)
- Pandas + lxml (data processing / XML parsing)

## Project Layout (Core)

```text
backend/
  app/
    main.py            # FastAPI entrypoint
    core/
      config.py        # settings (YAML config files)
      db.py            # async DB engine/session dependencies
    models/            # ORM models (to be added)
    services/          # business logic (to be added)
  config/
    config.dev.yaml    # development config
    config.prod.yaml   # production config
  pyproject.toml
  README.md
```

## Requirements

- Python >= 3.11
- uv (recommended for dependency management)
- MySQL 8.x (local or remote)

## Configuration (YAML Files)

Configuration is loaded from YAML files under `backend/config/`.

Config resolution order:

1. `backend/config/config.yaml` (if you create it)
2. `backend/config/config.dev.yaml` (default fallback)

You can also override the config file path with `IMVU_CONFIG_PATH` (optional).

Example (`config.dev.yaml`):

```yaml
app:
  name: "IMVU Insight API"
  env: "dev"
  api_v1_prefix: "/api/v1"

mysql:
  host: "127.0.0.1"
  port: 3306
  user: "root"
  password: ""
  db: "imvu_insight_dev"
  echo: true
```

The application builds the SQLAlchemy DSN as:
`mysql+asyncmy://<user>:<password>@<host>:<port>/<db>`

## Install Dependencies

From the `backend/` directory:

```bash
uv sync
```

Notes:

- `uv sync` will create/use a local virtual environment and install dependencies.
- To install without dev dependencies: `uv sync --no-dev`

## Run Locally (Development)

```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Endpoints:

- `GET http://localhost:8000/health` — service health check
- `GET http://localhost:8000/health/db` — database connectivity check (requires valid MySQL config)
- `GET http://localhost:8000/docs` — Swagger UI

## Quality (Optional)

```bash
uv run ruff check .
uv run black .
uv run pytest
```

## Suggested Next Steps

- Define ORM models in `app/models/` (e.g., products, income logs)
- Implement the ingestion pipeline in `app/services/`: XML -> DataFrame -> DB / metrics
- Add versioned APIs under `/api/v1` for metrics, products, revenue, and trends

