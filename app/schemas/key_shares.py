from typing import List
from pydantic import BaseModel


class KeyShareInfo(BaseModel):
    document_id: int
    user_id: int
    shares: List[str]
    total_shares: int
    assigned_shares: int
