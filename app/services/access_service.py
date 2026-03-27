from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Document, Collaborator, AccessRequest, Approval

THRESHOLD = 2


def _is_collaborator(db: Session, document_id: int, user_id: int) -> bool:
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        return False
    if doc.owner_id == user_id:
        return True
    collab = (
        db.query(Collaborator)
        .filter(Collaborator.document_id == document_id, Collaborator.user_id == user_id)
        .first()
    )
    return collab is not None


def request_access(db: Session, user_id: int, document_id: int) -> AccessRequest:
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if not doc.is_locked:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Document is already unlocked")
    if not _is_collaborator(db, document_id, user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only collaborators can request access")

    existing = (
        db.query(AccessRequest)
        .filter(
            AccessRequest.document_id == document_id,
            AccessRequest.requested_by == user_id,
            AccessRequest.status == "pending",
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Access request already pending")

    req = AccessRequest(document_id=document_id, requested_by=user_id)
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


def approve_request(db: Session, approver_id: int, request_id: int) -> AccessRequest:
    req = db.query(AccessRequest).filter(AccessRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if req.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Request is not pending")
    if req.requested_by == approver_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot approve your own request")
    if not _is_collaborator(db, req.document_id, approver_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only collaborators can approve")

    existing = (
        db.query(Approval)
        .filter(Approval.request_id == request_id, Approval.approved_by == approver_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Duplicate approval not allowed")

    approval = Approval(request_id=request_id, approved_by=approver_id)
    db.add(approval)
    db.commit()

    approvals_count = db.query(Approval).filter(Approval.request_id == request_id).count()
    if approvals_count >= THRESHOLD:
        doc = db.query(Document).filter(Document.id == req.document_id).first()
        if doc:
            doc.is_locked = False
        req.status = "approved"
        db.commit()
        db.refresh(req)

    return req


def get_request_status(db: Session, request_id: int, user_id: int) -> AccessRequest:
    req = db.query(AccessRequest).filter(AccessRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if req.requested_by != user_id and not _is_collaborator(db, req.document_id, user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this request")
    return req


def get_approvals_count(db: Session, request_id: int) -> int:
    return db.query(Approval).filter(Approval.request_id == request_id).count()
