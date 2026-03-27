from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Collaborator(Base):
    __tablename__ = "collaborators"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(50), default="editor", nullable=False)

    document = relationship("Document", back_populates="collaborators")
    user = relationship("User", back_populates="collaborations")
