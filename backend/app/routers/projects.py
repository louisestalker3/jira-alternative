import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User, Plan
from app.models.project import Project
from app.models.issue import Issue
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate

router = APIRouter(prefix="/projects", tags=["projects"])

FREE_PROJECT_LIMIT = 1


@router.get("", response_model=list[ProjectRead])
async def list_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).where(Project.owner_id == current_user.id).order_by(Project.created_at.desc())
    )
    projects = result.scalars().all()

    # Attach issue counts
    output = []
    for project in projects:
        count_result = await db.execute(
            select(func.count()).where(Issue.project_id == project.id)
        )
        count = count_result.scalar_one()
        p = ProjectRead.model_validate(project)
        p.issue_count = count
        output.append(p)
    return output


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.plan == Plan.free:
        count_result = await db.execute(
            select(func.count()).where(Project.owner_id == current_user.id)
        )
        count = count_result.scalar_one()
        if count >= FREE_PROJECT_LIMIT:
            raise HTTPException(
                status_code=403,
                detail="Free plan limited to 1 project. Upgrade to Pro for unlimited projects.",
            )

    # Validate key uniqueness per user
    existing = await db.execute(
        select(Project).where(Project.owner_id == current_user.id, Project.key == data.key.upper())
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Project key already in use")

    project = Project(
        name=data.name,
        key=data.key.upper(),
        description=data.description,
        owner_id=current_user.id,
    )
    db.add(project)
    await db.flush()
    await db.refresh(project)
    p = ProjectRead.model_validate(project)
    p.issue_count = 0
    return p


@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.owner_id == current_user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    count_result = await db.execute(select(func.count()).where(Issue.project_id == project.id))
    count = count_result.scalar_one()
    p = ProjectRead.model_validate(project)
    p.issue_count = count
    return p


@router.patch("/{project_id}", response_model=ProjectRead)
async def update_project(
    project_id: uuid.UUID,
    data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.owner_id == current_user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    await db.flush()
    await db.refresh(project)

    count_result = await db.execute(select(func.count()).where(Issue.project_id == project.id))
    count = count_result.scalar_one()
    p = ProjectRead.model_validate(project)
    p.issue_count = count
    return p


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.owner_id == current_user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    await db.delete(project)
