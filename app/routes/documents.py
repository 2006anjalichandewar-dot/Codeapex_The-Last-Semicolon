from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import User
from app.routes.deps import get_current_user
from app.schemas.documents import DocumentCreate, DocumentOut, CollaboratorAdd, CollaboratorOut
from app.services.document_service import create_document, get_accessible_documents, add_collaborator

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
