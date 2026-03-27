import logging
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.database import Base, engine
from app.core.logging import configure_logging
from app import models  # noqa: F401
from app.routes.auth import router as auth_router
from app.routes.documents import router as documents_router
from app.routes.access import router as access_router
from app.routes.websocket import router as websocket_router
from app.routes.audit import router as audit_router


def create_app() -> FastAPI:
    configure_logging()
    logger = logging.getLogger("app")
    app = FastAPI(title="ZeroTrust Docs API")

    Base.metadata.create_all(bind=engine)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ],
        allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth_router)
    app.include_router(documents_router)
    app.include_router(access_router)
    app.include_router(websocket_router)
    app.include_router(audit_router)

    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        start = time.time()
        response = await call_next(request)
        duration_ms = int((time.time() - start) * 1000)
        logger.info("%s %s -> %s (%sms)", request.method, request.url.path, response.status_code, duration_ms)
        return response

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        logger.warning("Validation error on %s: %s", request.url.path, exc.errors())
        return JSONResponse(status_code=422, content={"detail": exc.errors()})

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled error on %s", request.url.path)
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})

    return app


app = create_app()
