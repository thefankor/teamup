import uuid

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from src.models import BaseWithTimestamps


class Notification(BaseWithTimestamps):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projects.id"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    message: Mapped[str]
    link: Mapped[str | None]
