from pydantic import BaseModel, HttpUrl
from enum import Enum
from uuid import UUID
from datetime import datetime


class NotificationType(str, Enum):
    app_approved = "app_approved"
    app_rejected = "app_rejected"
    app_received = "app_received"
    member_added  = "member_added"
    project_status = "project_status"
    system = "system"


class Notification(BaseModel):
    id: UUID
    user_id: UUID
    type: NotificationType
    title: str
    text: str | None = None
    link_text: str | None = None
    link_url: HttpUrl | None = None
    project_id: UUID | None = None
    application_id: UUID | None = None

    is_read: bool = False
    created_at: datetime


class NotificationsPage(BaseModel):
    items: list[Notification]
    next_cursor: str | None = None
