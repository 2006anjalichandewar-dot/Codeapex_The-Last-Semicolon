from datetime import datetime
from pydantic import BaseModel


class DocumentCreate(BaseModel):
    title: str
    content: str = ""
    total_collaborators: int = 2
    threshold_required: int = 2


class DocumentOut(BaseModel):
    id: int
    title: str
    content: str
    owner_id: int
    is_locked: bool
    created_at: datetime
    encryption_key: str | None
    total_collaborators: int
    threshold_required: int

    class Config:
        orm_mode = True


class CollaboratorAdd(BaseModel):
    user_id: int
    role: str = "editor"


class CollaboratorOut(BaseModel):
    id: int
    document_id: int
    user_id: int
    role: str

    class Config:
        orm_mode = True
