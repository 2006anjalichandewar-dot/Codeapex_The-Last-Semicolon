from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, func, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, default="")
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_locked = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="documents")
    collaborators = relationship("Collaborator", back_populates="document")
