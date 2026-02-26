import uuid

from sqlalchemy import Boolean, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from src.models.base import BaseWithTimestamps
from src.models.enums import UserType


class User(BaseWithTimestamps):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    user_type: Mapped[UserType] = mapped_column(
        Enum(UserType, native_enum=False),
        default=UserType.USER,
        server_default="user",
        nullable=False,
    )
    phone: Mapped[str | None]

    first_name: Mapped[str | None]
    last_name: Mapped[str | None]
    middle_name: Mapped[str | None]
    avatar_key: Mapped[str | None]
    position: Mapped[str | None]
    about: Mapped[str | None]
    looking_for_projects: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true"
    )
    tags: Mapped[list[str]] = mapped_column(JSONB, default=[], server_default="[]")
    skills: Mapped[list[str]] = mapped_column(JSONB, default=[], server_default="[]")

    github_username: Mapped[str | None]
    vk_username: Mapped[str | None]
    tg_username: Mapped[str | None]
    whatsapp_username: Mapped[str | None]


class UserEducation(BaseWithTimestamps):
    __tablename__ = "users_education"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))

    university: Mapped[str]
    specialty: Mapped[str]
    degree: Mapped[str]
    graduation_year: Mapped[int]
