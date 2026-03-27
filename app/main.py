from fastapi import FastAPI

from app.core.database import Base, engine
from app import models  # noqa: F401
from app.routes.auth import router as auth_router
from app.routes.documents import router as documents_router
from app.routes.access import router as access_router
from app.routes.websocket import router as websocket_router
from app.routes.audit import router as audit_router


def create_app() -> FastAPI:
    app = FastAPI(title="ZeroTrust Docs API")

    Base.metadata.create_all(bind=engine)

    app.include_router(auth_router)
    app.include_router(documents_router)
    app.include_router(access_router)
    app.include_router(websocket_router)
    app.include_router(audit_router)
    return app


app = create_app()
