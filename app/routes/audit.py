from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import User
from app.routes.deps import get_current_user
from app.schemas.audit import AuditLogOut, ActivityLogOut
from app.services.audit_service import get_document_history, get_history_for_documents
from app.core.cache_instance import cache
from app.services.document_service import get_accessible_documents
from app.models import Document, User

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


@router.get("/activity", response_model=List[ActivityLogOut])
def activity_feed_route(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    action: str | None = None,
    document_id: int | None = None,
):
    accessible = get_accessible_documents(db, current_user.id)
    doc_ids = [doc.id for doc in accessible]
    if document_id is not None:
        doc_ids = [doc_id for doc_id in doc_ids if doc_id == document_id]
    history = get_history_for_documents(db, doc_ids)
    if not history:
        return []
    doc_map = {
        doc.id: doc.title
        for doc in db.query(Document).filter(Document.id.in_(doc_ids)).all()
    }
    user_ids = {item.user_id for item in history}
    user_map = {
        user.id: user.email
        for user in db.query(User).filter(User.id.in_(user_ids)).all()
    }
    payload: list[ActivityLogOut] = []
    for item in history:
        if action and item.action != action:
            continue
        row = ActivityLogOut(
            id=item.id,
            document_id=item.document_id,
            document_title=doc_map.get(item.document_id, f"Document #{item.document_id}"),
            user_id=item.user_id,
            user_email=user_map.get(item.user_id),
            action=item.action,
            timestamp=item.timestamp,
            hash=item.hash,
            previous_hash=item.previous_hash,
        )
        payload.append(row)
    return payload
