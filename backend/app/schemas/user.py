import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.models.user import Plan


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str


class UserRead(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    is_active: bool
    plan: Plan
    onboarded: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    onboarded: bool | None = None


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserRead


class TokenData(BaseModel):
    user_id: str | None = None
