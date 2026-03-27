from datetime import datetime
from pydantic import BaseModel


class AuditLogOut(BaseModel):
    id: int
    document_id: int
    user_id: int
    action: str
    timestamp: datetime
    hash: str
    previous_hash: str | None

    class Config:
        orm_mode = True


class ActivityLogOut(BaseModel):
    id: int
    document_id: int
    document_title: str
    user_id: int
    user_email: str | None
    action: str
    timestamp: datetime
    hash: str
    previous_hash: str | None

    class Config:
        orm_mode = True
