from pydantic import BaseModel


class AccessRequestCreate(BaseModel):
    document_id: int


class ApproveRequestCreate(BaseModel):
    request_id: int


class AccessRequestOut(BaseModel):
    id: int
    document_id: int
    requested_by: int
    status: str
    approvals_count: int

    class Config:
        orm_mode = True
