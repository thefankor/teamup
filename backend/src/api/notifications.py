from uuid import UUID

from fastapi import APIRouter, Depends
from starlette import status

from src.core.dependencies import get_current_user
from src.schemas.notifications import NotificationsPage

router = APIRouter(tags=["Notifications"])


from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationsPage)
async def list_notifications(
    only_unread: bool = False,
    limit: int = 20,
    cursor: str | None = None,
    user = Depends(get_current_user),
):
    pass


@router.post("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_read(notification_id: UUID, user = Depends(get_current_user)):
    pass


@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_read(user = Depends(get_current_user)):
    pass

@router.get("/unread-count", response_model=int)
async def unread_count(user_id = Depends(get_current_user)):
    pass
