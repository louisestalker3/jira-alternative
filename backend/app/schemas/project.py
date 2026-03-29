import uuid
from datetime import datetime
from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    key: str
    description: str | None = None


class ProjectRead(BaseModel):
    id: uuid.UUID
    name: str
    key: str
    description: str | None
    owner_id: uuid.UUID
    created_at: datetime
    issue_count: int = 0

    model_config = {"from_attributes": True}


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
