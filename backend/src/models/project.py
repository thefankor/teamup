import uuid

from sqlalchemy import Boolean, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped
from sqlalchemy.testing.schema import mapped_column
from src.models import BaseWithTimestamps
from src.models.enums import ApplicationStatus


class Project(BaseWithTimestamps):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str]
    description: Mapped[str]
    tags: Mapped[list[str]] = mapped_column(JSONB, default=[], server_default="[]")
    is_open: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))


class ProjectPosition(BaseWithTimestamps):
    __tablename__ = "project_positions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projects.id"))

    name: Mapped[str]
    role: Mapped[str]
    level: Mapped[str]


class ProjectApplication(BaseWithTimestamps):
    __tablename__ = "project_applications"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projects.id"))
    position_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("project_positions.id"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    message: Mapped[str | None]
    note: Mapped[str | None]
    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(ApplicationStatus), default=ApplicationStatus.PENDING
    )


class ProjectParticipant(BaseWithTimestamps):
    __tablename__ = "project_participants"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projects.id"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    role: Mapped[str]
