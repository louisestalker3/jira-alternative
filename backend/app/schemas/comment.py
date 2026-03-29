import uuid
from datetime import datetime
from pydantic import BaseModel


class CommentAuthor(BaseModel):
    id: uuid.UUID
    name: str
    email: str

    model_config = {"from_attributes": True}


class CommentCreate(BaseModel):
    content: str


class CommentRead(BaseModel):
    id: uuid.UUID
    issue_id: uuid.UUID
    author_id: uuid.UUID
    content: str
    author: CommentAuthor
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CommentUpdate(BaseModel):
    content: str
