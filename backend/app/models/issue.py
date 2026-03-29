import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, Integer, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.database import Base


class IssueStatus(str, enum.Enum):
    backlog = "backlog"
    todo = "todo"
    in_progress = "in_progress"
    in_review = "in_review"
    done = "done"


class IssuePriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"


class IssueType(str, enum.Enum):
    task = "task"
    bug = "bug"
    story = "story"
    feature = "feature"


class Issue(Base):
    __tablename__ = "issues"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[IssueStatus] = mapped_column(SAEnum(IssueStatus), default=IssueStatus.todo, nullable=False)
    priority: Mapped[IssuePriority] = mapped_column(SAEnum(IssuePriority), default=IssuePriority.medium, nullable=False)
    type: Mapped[IssueType] = mapped_column(SAEnum(IssueType), default=IssueType.task, nullable=False)
    order: Mapped[int] = mapped_column(Integer, default=0)
    reporter_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assignee_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project: Mapped["Project"] = relationship("Project", back_populates="issues")
    reporter: Mapped["User"] = relationship("User", foreign_keys=[reporter_id], back_populates="reported_issues")
    assignee: Mapped["User | None"] = relationship("User", foreign_keys=[assignee_id], back_populates="assigned_issues")
    comments: Mapped[list["Comment"]] = relationship("Comment", back_populates="issue", cascade="all, delete-orphan")
