# ZeroTrust Docs API

FastAPI backend for secure collaborative document editing.

## Quick start

1. Install dependencies

```bash
pip install -r requirements.txt
```

2. Configure environment

Copy `.env.example` to `.env` and adjust as needed.

3. (Optional) Start Postgres + Redis via Docker

```bash
docker compose -f docker-compose.postgres.yml up -d
```

4. Run the API

```bash
uvicorn app.main:app --reload
```

## API overview

- `POST /auth/signup`
- `POST /auth/login`
- `POST /documents/`
- `GET /documents/`
- `POST /documents/{document_id}/collaborators`
- `GET /documents/{document_id}/shares` (demo: shows your assigned share)
- `POST /request-access`
- `POST /approve-request`
- `GET /request-status`
- `WS /ws/{document_id}?token=JWT`
- `GET /document-history/{document_id}`
- Document creation now generates a simulated encryption key and 3 key shares.
Redis caching is used when `ZT_REDIS_URL` is set (falls back to in-memory cache).

## Demo Flow (Threshold Unlock)
1. Create a document (owner gets one key share).
2. Add 2 collaborators (shares assigned automatically).
3. Request access to the document.
4. Two collaborators approve.
5. Document unlocks after simulated reconstruction.
