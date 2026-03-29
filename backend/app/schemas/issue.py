import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.issue import IssueStatus, IssuePriority, IssueType


class IssueCreate(BaseModel):
    title: str
    description: str | None = None
    status: IssueStatus = IssueStatus.todo
    priority: IssuePriority = IssuePriority.medium
    type: IssueType = IssueType.task
    assignee_id: uuid.UUID | None = None


class AssigneeInfo(BaseModel):
    id: uuid.UUID
    name: str
    email: str

    model_config = {"from_attributes": True}


class IssueRead(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    number: int
    title: str
    description: str | None
    status: IssueStatus
    priority: IssuePriority
    type: IssueType
    order: int
    reporter_id: uuid.UUID
    assignee_id: uuid.UUID | None
    assignee: AssigneeInfo | None
    comment_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class IssueUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: IssueStatus | None = None
    priority: IssuePriority | None = None
    type: IssueType | None = None
    assignee_id: uuid.UUID | None = None
    order: int | None = None
