from typing import List
from pydantic import BaseModel


class AccessRequestListItem(BaseModel):
    id: int
    document_id: int
    requested_by: int
    status: str
    approvals_count: int

    class Config:
        orm_mode = True
