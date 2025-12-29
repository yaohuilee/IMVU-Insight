# IMVU Insight

A data visualization and insight platform for IMVU creators, built with FastAPI and an Ant Design/Umi Max frontend.

---

## Overview

IMVU Insight turns IMVU export files (product list + income log) into structured data, APIs, and dashboards. The backend handles parsing and persistence; the frontend provides data management and analysis views.

---

## What's Implemented

- Upload + parse IMVU XML exports for product list and income log
- Data sync records saved to DB and original files archived in `backend/data/uploads`
- Core domain models and APIs for products, income transactions, buyers, recipients, and IMVU users
- FastAPI health endpoints and Swagger docs
- Umi Max frontend with login, dashboard, data sync UI, business analysis pages, and IMVU graph pages
- Multi-language UI strings (en-US, es-ES, ja-JP, zh-CN, zh-TW)

---

## Project Structure

```text
IMVU-Insight/
  backend/   # FastAPI backend services + data processing
  frontend/  # Umi Max + Ant Design frontend
  data/      # Sample IMVU exports
  docs/      # Data model design notes
  README.md
```

---

## Tech Stack

### Backend
- Python + FastAPI
- SQLAlchemy (async) + MySQL (asyncmy)
- Pandas, lxml, python-multipart

### Frontend
- React + TypeScript
- Umi Max (`@umijs/max`)
- Ant Design + Ant Design Pro Components

### Tooling
- uv (Python deps)
- Yarn 4 (frontend)

---

## Current Status

- [x] Backend data sync uploads and raw storage
- [x] APIs for products, income transactions, buyers/recipients, and IMVU users
- [x] Frontend navigation + data management + business analysis scaffolding
- [ ] Analytics charts (sales trends, product lifecycle)
- [ ] Graph relationships visualization
- [ ] Data quality / snapshots module

---

## Docs & Samples

- Data model design: `docs/data-model-design.*`
- Sample exports: `data/samples`

---

## Getting Started

See `backend/README.md` and `frontend/README.md` for local setup and commands.
