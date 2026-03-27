# ZeroTrust Docs API

FastAPI backend for secure collaborative document editing.

## Quick start

1. Install dependencies

```bash
pip install -r requirements.txt
```

2. Configure environment

Copy `.env.example` to `.env` and adjust as needed.

3. Run the API

```bash
uvicorn app.main:app --reload
```

## API overview

- `POST /auth/signup`
- `POST /auth/login`
- `POST /documents/`
- `GET /documents/`
- `POST /documents/{document_id}/collaborators`
- `POST /request-access`
- `POST /approve-request`
- `GET /request-status`
- `WS /ws/{document_id}?token=JWT`
- `GET /document-history/{document_id}`
- Document creation now generates a simulated encryption key and 3 key shares.
