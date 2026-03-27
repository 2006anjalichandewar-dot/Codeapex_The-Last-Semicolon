from __future__ import annotations

from datetime import datetime
import hashlib
from typing import List

from sqlalchemy.orm import Session

from app.models import AuditLog
from app.core.cache_instance import cache
from app.services.fabric_service import submit_audit_log


def _compute_hash(document_id: int, user_id: int, action: str, timestamp: datetime, previous_hash: str | None) -> str:
    base = f"{document_id}|{user_id}|{action}|{timestamp.isoformat()}|{previous_hash or ''}"
    return hashlib.sha256(base.encode("utf-8")).hexdigest()


def append_audit_log(db: Session, document_id: int, user_id: int, action: str) -> AuditLog:
    last = (
        db.query(AuditLog)
        .filter(AuditLog.document_id == document_id)
        .order_by(AuditLog.id.desc())
        .first()
    )
    previous_hash = last.hash if last else None
    timestamp = datetime.utcnow()
    entry_hash = _compute_hash(document_id, user_id, action, timestamp, previous_hash)

    log = AuditLog(
        document_id=document_id,
        user_id=user_id,
        action=action,
        timestamp=timestamp,
        hash=entry_hash,
        previous_hash=previous_hash,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    cache.delete(f"audit:{document_id}")
    submit_audit_log(
        {
            "id": log.id,
            "document_id": document_id,
            "user_id": user_id,
            "action": action,
            "timestamp": log.timestamp.isoformat(),
            "hash": log.hash,
            "previous_hash": log.previous_hash,
        }
    )
    return log


def get_document_history(db: Session, document_id: int) -> List[AuditLog]:
    return (
        db.query(AuditLog)
        .filter(AuditLog.document_id == document_id)
        .order_by(AuditLog.id.asc())
        .all()
    )


def get_history_for_documents(db: Session, document_ids: list[int]) -> List[AuditLog]:
    if not document_ids:
        return []
    return (
        db.query(AuditLog)
        .filter(AuditLog.document_id.in_(document_ids))
        .order_by(AuditLog.id.desc())
        .all()
    )
