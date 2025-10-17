from sqlalchemy import Boolean, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from src.models.base import BaseWithTimestamps
from src.models.enums import UserGender, UserRole, UserTimezone


class User(BaseWithTimestamps):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String, unique=True, index=True)

    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.CLIENT)
    name: Mapped[str | None] = mapped_column(String)
    age: Mapped[int | None] = mapped_column(Integer)
    gender: Mapped[UserGender | None] = mapped_column(Enum(UserGender))

    notifications: Mapped[bool] = mapped_column(Boolean, default=True)
    timezone: Mapped[UserTimezone | None]
    avatar: Mapped[str | None]
