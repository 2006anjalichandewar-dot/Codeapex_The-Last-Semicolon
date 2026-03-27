from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class Approval(Base):
    __tablename__ = "approvals"
    __table_args__ = (UniqueConstraint("request_id", "approved_by", name="uq_request_approver"),)

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("access_requests.id"), nullable=False)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    request = relationship("AccessRequest", back_populates="approvals")
    approver = relationship("User")
