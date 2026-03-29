import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.issue import Issue
from app.models.comment import Comment
from app.schemas.comment import CommentCreate, CommentRead, CommentUpdate

router = APIRouter(prefix="/projects/{project_id}/issues/{issue_id}/comments", tags=["comments"])


async def get_issue_or_404(project_id: uuid.UUID, issue_id: uuid.UUID, user: User, db: AsyncSession) -> Issue:
    proj_result = await db.execute(
        select(Project).where(Project.id == project_id, Project.owner_id == user.id)
    )
    if not proj_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")

    issue_result = await db.execute(
        select(Issue).where(Issue.id == issue_id, Issue.project_id == project_id)
    )
    issue = issue_result.scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue


@router.get("", response_model=list[CommentRead])
async def list_comments(
    project_id: uuid.UUID,
    issue_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_issue_or_404(project_id, issue_id, current_user, db)

    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.author))
        .where(Comment.issue_id == issue_id)
        .order_by(Comment.created_at)
    )
    return result.scalars().all()


@router.post("", response_model=CommentRead, status_code=status.HTTP_201_CREATED)
async def create_comment(
    project_id: uuid.UUID,
    issue_id: uuid.UUID,
    data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_issue_or_404(project_id, issue_id, current_user, db)

    comment = Comment(
        issue_id=issue_id,
        author_id=current_user.id,
        content=data.content,
    )
    db.add(comment)
    await db.flush()

    result = await db.execute(
        select(Comment).options(selectinload(Comment.author)).where(Comment.id == comment.id)
    )
    return result.scalar_one()


@router.patch("/{comment_id}", response_model=CommentRead)
async def update_comment(
    project_id: uuid.UUID,
    issue_id: uuid.UUID,
    comment_id: uuid.UUID,
    data: CommentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_issue_or_404(project_id, issue_id, current_user, db)

    result = await db.execute(
        select(Comment).options(selectinload(Comment.author)).where(Comment.id == comment_id)
    )
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your comment")

    comment.content = data.content
    await db.flush()
    await db.refresh(comment)

    result = await db.execute(
        select(Comment).options(selectinload(Comment.author)).where(Comment.id == comment.id)
    )
    return result.scalar_one()


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    project_id: uuid.UUID,
    issue_id: uuid.UUID,
    comment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_issue_or_404(project_id, issue_id, current_user, db)

    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your comment")

    await db.delete(comment)
