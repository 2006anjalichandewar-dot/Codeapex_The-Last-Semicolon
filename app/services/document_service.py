from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models import Document, Collaborator


def create_document(db: Session, owner_id: int, title: str, content: str) -> Document:
    doc = Document(title=title, content=content, owner_id=owner_id)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def get_accessible_documents(db: Session, user_id: int) -> List[Document]:
    return (
        db.query(Document)
        .outerjoin(Collaborator, Collaborator.document_id == Document.id)
        .filter(or_(Document.owner_id == user_id, Collaborator.user_id == user_id))
        .distinct()
        .all()
    )


def add_collaborator(db: Session, owner_id: int, document_id: int, user_id: int, role: str) -> Collaborator:
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if doc.owner_id != owner_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the owner can add collaborators")

    existing = (
        db.query(Collaborator)
        .filter(Collaborator.document_id == document_id, Collaborator.user_id == user_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already a collaborator")

    collab = Collaborator(document_id=document_id, user_id=user_id, role=role)
    db.add(collab)
    db.commit()
    db.refresh(collab)
    return collab
