from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import User
from app.routes.deps import get_current_user
from app.schemas.audit import AuditLogOut
from app.services.audit_service import get_document_history
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
        return []
    return get_document_history(db, document_id)
