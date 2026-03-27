from typing import List

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import User
from app.routes.deps import get_current_user
from app.schemas.documents import DocumentCreate, DocumentOut, CollaboratorAdd, CollaboratorOut
from app.schemas.key_shares import KeyShareInfo
from app.services.document_service import create_document, get_accessible_documents, add_collaborator
from app.services.key_share_service import get_user_shares, get_share_counts

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
def create_document_route(
    payload: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_document(db, current_user.id, payload.title, payload.content)


@router.get("/", response_model=List[DocumentOut])
def list_documents_route(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_accessible_documents(db, current_user.id)


@router.post("/{document_id}/collaborators", response_model=CollaboratorOut)
def add_collaborator_route(
    document_id: int,
    payload: CollaboratorAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return add_collaborator(db, current_user.id, document_id, payload.user_id, payload.role)


@router.get("/{document_id}/shares", response_model=KeyShareInfo)
def get_key_shares_route(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    accessible = get_accessible_documents(db, current_user.id)
    if document_id not in {doc.id for doc in accessible}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view shares")
    shares = get_user_shares(db, document_id, current_user.id)
    total, assigned = get_share_counts(db, document_id)
    return KeyShareInfo(
        document_id=document_id,
        user_id=current_user.id,
        shares=shares,
        total_shares=total,
        assigned_shares=assigned,
    )
