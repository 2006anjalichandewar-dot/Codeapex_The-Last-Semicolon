from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import User
from app.routes.deps import get_current_user
from app.schemas.audit import AuditLogOut
from app.services.audit_service import get_document_history
from app.core.cache_instance import cache
from app.services.document_service import get_accessible_documents

router = APIRouter(tags=["audit"])


@router.get("/document-history/{document_id}", response_model=List[AuditLogOut])
def document_history_route(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    accessible = get_accessible_documents(db, current_user.id)
    if document_id not in {doc.id for doc in accessible}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view document history")
    cache_key = f"audit:{document_id}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    history = get_document_history(db, document_id)
    payload = []
    for item in history:
        row = AuditLogOut.from_orm(item).dict()
        if isinstance(row.get("timestamp"), (str, type(None))):
            payload.append(row)
        else:
            row["timestamp"] = row["timestamp"].isoformat()
            payload.append(row)
    cache.set(cache_key, payload, ttl_seconds=30)
    return payload
