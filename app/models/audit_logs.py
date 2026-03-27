from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship

from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(50), nullable=False)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    hash = Column(String(64), nullable=False)
    previous_hash = Column(String(64), nullable=True)

    document = relationship("Document")
    user = relationship("User")
