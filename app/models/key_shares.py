from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class KeyShare(Base):
    __tablename__ = "key_shares"
    __table_args__ = (UniqueConstraint("document_id", "user_id", name="uq_keyshare_document_user"),)

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    share = Column(String(255), nullable=False)

    document = relationship("Document")
    user = relationship("User")
