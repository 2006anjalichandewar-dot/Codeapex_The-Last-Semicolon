import secrets
from typing import List

from sqlalchemy.orm import Session

from app.models import KeyShare


def generate_key() -> str:
    return secrets.token_hex(16)


def split_key(key: str) -> List[str]:
    part1 = key[:10]
    part2 = key[10:20]
    part3 = key[20:]
    return [f"part1:{part1}", f"part2:{part2}", f"part3:{part3}"]


def create_shares(db: Session, document_id: int, owner_id: int, key: str) -> None:
    shares = split_key(key)
    records = [
        KeyShare(document_id=document_id, user_id=owner_id, share=shares[0]),
        KeyShare(document_id=document_id, user_id=None, share=shares[1]),
        KeyShare(document_id=document_id, user_id=None, share=shares[2]),
    ]
    db.add_all(records)
    db.commit()


def assign_share_to_user(db: Session, document_id: int, user_id: int) -> None:
    existing = (
        db.query(KeyShare)
        .filter(KeyShare.document_id == document_id, KeyShare.user_id == user_id)
        .first()
    )
    if existing:
        return

    unassigned = (
        db.query(KeyShare)
        .filter(KeyShare.document_id == document_id, KeyShare.user_id.is_(None))
        .order_by(KeyShare.id.asc())
        .first()
    )
    if not unassigned:
        return

    unassigned.user_id = user_id
    db.commit()


def get_shares_for_users(db: Session, document_id: int, user_ids: List[int]) -> List[str]:
    rows = (
        db.query(KeyShare)
        .filter(KeyShare.document_id == document_id, KeyShare.user_id.in_(user_ids))
        .all()
    )
    return [row.share for row in rows]


def get_user_shares(db: Session, document_id: int, user_id: int) -> List[str]:
    rows = (
        db.query(KeyShare)
        .filter(KeyShare.document_id == document_id, KeyShare.user_id == user_id)
        .all()
    )
    return [row.share for row in rows]


def get_share_counts(db: Session, document_id: int) -> tuple[int, int]:
    total = db.query(KeyShare).filter(KeyShare.document_id == document_id).count()
    assigned = (
        db.query(KeyShare)
        .filter(KeyShare.document_id == document_id, KeyShare.user_id.is_not(None))
        .count()
    )
    return total, assigned


def reconstruct_key(shares: List[str]) -> str:
    # Simulated reconstruction: concatenate two shares deterministically
    return "+".join(sorted(shares)[:2])
