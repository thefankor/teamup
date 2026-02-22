import uuid

from sqlalchemy import ForeignKey, Integer, text
from sqlalchemy.orm import Mapped, mapped_column
from src.models import BaseWithTimestamps


class Session(BaseWithTimestamps):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    version: Mapped[int] = mapped_column(Integer, server_default=text("1"))
    is_active: Mapped[bool] = mapped_column(default=True, server_default=text("true"))
