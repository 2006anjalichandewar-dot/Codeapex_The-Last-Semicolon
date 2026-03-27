from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import User
from app.routes.deps import get_current_user
from app.schemas.access import AccessRequestCreate, ApproveRequestCreate, AccessRequestOut
from app.services.access_service import (
    request_access,
    approve_request,
    get_request_status,
    get_approvals_count,
)

router = APIRouter(tags=["access"])


def _to_out(db: Session, req) -> AccessRequestOut:
    return AccessRequestOut(
        id=req.id,
        document_id=req.document_id,
        requested_by=req.requested_by,
        status=req.status,
        approvals_count=get_approvals_count(db, req.id),
    )


@router.post("/request-access", response_model=AccessRequestOut)
def request_access_route(
    payload: AccessRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = request_access(db, current_user.id, payload.document_id)
    return _to_out(db, req)


@router.post("/approve-request", response_model=AccessRequestOut)
def approve_request_route(
    payload: ApproveRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = approve_request(db, current_user.id, payload.request_id)
    return _to_out(db, req)


@router.get("/request-status", response_model=AccessRequestOut)
def request_status_route(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = get_request_status(db, request_id, current_user.id)
    return _to_out(db, req)
