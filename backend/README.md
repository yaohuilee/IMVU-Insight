# IMVU Insight Backend

FastAPI service for importing IMVU export files, persisting to MySQL, and serving analytics APIs.

## Features

- Upload product list and income log XML via `/data-sync`
- Store original uploads in `backend/data/uploads`
- APIs for products, income transactions, buyers, recipients, and IMVU users
- Health checks and Swagger docs

## Tech Stack

- FastAPI
- SQLAlchemy 2.x (async) + MySQL (asyncmy)
- Pandas, lxml, python-multipart

## Project Layout (Core)

```text
backend/
  app/
    main.py            # FastAPI entrypoint
    core/
      config.py        # settings (YAML config files)
      db.py            # async DB engine/session dependencies
    models/            # ORM models
    routes/            # API routers
    services/          # business logic
  config/
    config.dev.yaml    # development config
    config.prod.yaml   # production config
  data/uploads/        # archived uploads
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

- `uv sync` will create or use a local virtual environment and install dependencies.
- To install without dev dependencies: `uv sync --no-dev`

## Run Locally (Development)

```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Key Endpoints

- `GET /health`
- `GET /health/db`
- `GET /docs`
- `POST /data-sync/product/import`
- `POST /data-sync/income/import`
- `GET /data-sync/list`
- `POST /product/list`
- `POST /income_transaction/list`
- `POST /buyer/list`
- `POST /recipient/list`
- `POST /imvu_user/list`

## Quality (Optional)

```bash
uv run ruff check .
uv run black .
uv run pytest
```

## Suggested Next Steps

- Add aggregation endpoints for trends and lifecycle metrics
- Expand graph and relationship APIs
- Add data quality and snapshot summaries
