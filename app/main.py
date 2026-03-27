from fastapi import FastAPI

from app.core.database import Base, engine
from app import models  # noqa: F401
from app.routes.auth import router as auth_router
from app.routes.documents import router as documents_router


def create_app() -> FastAPI:
    app = FastAPI(title="ZeroTrust Docs API")

    Base.metadata.create_all(bind=engine)

    app.include_router(auth_router)
    app.include_router(documents_router)
    return app


app = create_app()
