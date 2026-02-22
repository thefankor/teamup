from uuid import UUID

from fastapi import APIRouter, Depends, status
from src.core.dependencies import require_permission
from src.core.permissions import NOTIFICATIONS_READ_OWN
from src.schemas.notifications import NotificationsPage

router = APIRouter(tags=["Notifications"])


@router.get("", response_model=NotificationsPage)
async def list_notifications(
    only_unread: bool = False,
    limit: int = 20,
    cursor: str | None = None,
    current_user_id: UUID = Depends(require_permission(NOTIFICATIONS_READ_OWN)),
):
    pass


@router.post("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_read(
    notification_id: UUID,
    current_user_id: UUID = Depends(require_permission(NOTIFICATIONS_READ_OWN)),
):
    pass


@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_read(
    current_user_id: UUID = Depends(require_permission(NOTIFICATIONS_READ_OWN)),
):
    pass


@router.get("/unread-count", response_model=int)
async def unread_count(
    current_user_id: UUID = Depends(require_permission(NOTIFICATIONS_READ_OWN)),
):
    pass
