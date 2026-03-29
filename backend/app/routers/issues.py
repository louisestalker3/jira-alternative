import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User, Plan
from app.models.project import Project
from app.models.issue import Issue
from app.models.comment import Comment
from app.schemas.issue import IssueCreate, IssueRead, IssueUpdate

router = APIRouter(prefix="/projects/{project_id}/issues", tags=["issues"])

FREE_ISSUE_LIMIT = 10


async def get_project_or_404(project_id: uuid.UUID, user: User, db: AsyncSession) -> Project:
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.owner_id == user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("", response_model=list[IssueRead])
async def list_issues(
    project_id: uuid.UUID,
    status_filter: str | None = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_project_or_404(project_id, current_user, db)

    query = (
        select(Issue)
        .options(selectinload(Issue.assignee))
        .where(Issue.project_id == project_id)
        .order_by(Issue.status, Issue.order, Issue.created_at)
    )
    if status_filter:
        from app.models.issue import IssueStatus
        try:
            query = query.where(Issue.status == IssueStatus(status_filter))
        except ValueError:
            pass

    result = await db.execute(query)
    issues = result.scalars().all()

    output = []
    for issue in issues:
        count_result = await db.execute(
            select(func.count()).where(Comment.issue_id == issue.id)
        )
        count = count_result.scalar_one()
        i = IssueRead.model_validate(issue)
        i.comment_count = count
        output.append(i)
    return output


@router.post("", response_model=IssueRead, status_code=status.HTTP_201_CREATED)
async def create_issue(
    project_id: uuid.UUID,
    data: IssueCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_project_or_404(project_id, current_user, db)

    if current_user.plan == Plan.free:
        count_result = await db.execute(
            select(func.count()).where(Issue.project_id == project_id)
        )
        count = count_result.scalar_one()
        if count >= FREE_ISSUE_LIMIT:
            raise HTTPException(
                status_code=403,
                detail=f"Free plan limited to {FREE_ISSUE_LIMIT} issues per project. Upgrade to Pro for unlimited.",
            )

    # Auto-increment issue number within project
    max_result = await db.execute(
        select(func.max(Issue.number)).where(Issue.project_id == project_id)
    )
    max_number = max_result.scalar_one() or 0

    # Get current max order for status column
    order_result = await db.execute(
        select(func.max(Issue.order)).where(Issue.project_id == project_id, Issue.status == data.status)
    )
    max_order = order_result.scalar_one() or 0

    issue = Issue(
        project_id=project_id,
        number=max_number + 1,
        title=data.title,
        description=data.description,
        status=data.status,
        priority=data.priority,
        type=data.type,
        assignee_id=data.assignee_id,
        reporter_id=current_user.id,
        order=max_order + 1,
    )
    db.add(issue)
    await db.flush()

    result = await db.execute(
        select(Issue).options(selectinload(Issue.assignee)).where(Issue.id == issue.id)
    )
    issue = result.scalar_one()
    i = IssueRead.model_validate(issue)
    i.comment_count = 0
    return i


@router.get("/{issue_id}", response_model=IssueRead)
async def get_issue(
    project_id: uuid.UUID,
    issue_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_project_or_404(project_id, current_user, db)

    result = await db.execute(
        select(Issue)
        .options(selectinload(Issue.assignee))
        .where(Issue.id == issue_id, Issue.project_id == project_id)
    )
    issue = result.scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    count_result = await db.execute(select(func.count()).where(Comment.issue_id == issue.id))
    count = count_result.scalar_one()
    i = IssueRead.model_validate(issue)
    i.comment_count = count
    return i


@router.patch("/{issue_id}", response_model=IssueRead)
async def update_issue(
    project_id: uuid.UUID,
    issue_id: uuid.UUID,
    data: IssueUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_project_or_404(project_id, current_user, db)

    result = await db.execute(
        select(Issue)
        .options(selectinload(Issue.assignee))
        .where(Issue.id == issue_id, Issue.project_id == project_id)
    )
    issue = result.scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(issue, field, value)

    await db.flush()
    await db.refresh(issue)

    # Reload with relationships
    result = await db.execute(
        select(Issue).options(selectinload(Issue.assignee)).where(Issue.id == issue.id)
    )
    issue = result.scalar_one()

    count_result = await db.execute(select(func.count()).where(Comment.issue_id == issue.id))
    count = count_result.scalar_one()
    i = IssueRead.model_validate(issue)
    i.comment_count = count
    return i


@router.delete("/{issue_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_issue(
    project_id: uuid.UUID,
    issue_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_project_or_404(project_id, current_user, db)

    result = await db.execute(
        select(Issue).where(Issue.id == issue_id, Issue.project_id == project_id)
    )
    issue = result.scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    await db.delete(issue)
