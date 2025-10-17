from pydantic import BaseModel, HttpUrl
from uuid import UUID
from enum import Enum
from datetime import datetime


class ProjectStatus(str, Enum):
    open = "open"
    closed = "closed"
    draft = "draft"

class Level(str, Enum):
    junior = "junior"
    middle = "middle"
    senior = "senior"


class ProjectMember(BaseModel):
    user_id: UUID
    full_name: str
    avatar_url: HttpUrl | None = None
    roles: list[str]
    tags: list[str]
    is_owner: bool = False


class ProjectPosition(BaseModel):
    id: UUID
    role: str
    level: Level
    tags: list[str]
    is_open: bool = True
    created_at: datetime


class ProjectCard(BaseModel):
    id: UUID
    title: str
    excerpt: str | None = None
    tags: list[str]
    created_at: datetime


class Project(BaseModel):
    id: UUID
    owner_id: UUID
    title: str
    description: str | None = None
    tags: list[str]
    status: ProjectStatus = ProjectStatus.open
    created_at: datetime
    updated_at: datetime

    team: list[ProjectMember]
    positions: list[ProjectPosition]


class ProjectPositionCreate(BaseModel):
    role: str
    level: Level
    tags: list[str]


class ProjectPositionUpdate(BaseModel):
    role: str | None = None
    level: Level | None = None
    tags: list[str] | None = None
    is_open: bool | None = None


class ProjectCreate(BaseModel):
    title: str
    description: str | None = None
    tags: list[str]
    positions: list[ProjectPositionCreate]


class ProjectUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    tags: list[str] | None = None
    status: ProjectStatus | None = None


class ProjectsPage(BaseModel):
    items: list[ProjectCard]
    next_cursor: str | None = None


class ProjectFilters(BaseModel):
    q: str | None = None
    tags: list[str] = []
    role: str | None = None
    level: Level | None = None
    limit: int = 20
    cursor: str | None = None


class ApplicationStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    withdrawn = "withdrawn"


class Application(BaseModel):
    id: UUID
    project_id: UUID
    applicant_id: UUID
    position_ids: list[UUID]
    message: str | None = None
    status: ApplicationStatus
    created_at: datetime
    decided_at: datetime | None = None
    decided_by: UUID | None = None


class ApplicationCreate(BaseModel):
    position_ids: list[UUID]
    message: str | None = None

class ApplicationDecision(BaseModel):
    approve: bool
    note: str | None = None

class ApplicationsPage(BaseModel):
    items: list[Application]
    next_cursor: str | None = None
