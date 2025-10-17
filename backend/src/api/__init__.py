from fastapi import APIRouter

from src.api.auth import router as auth_router
from src.api.user import router as user_router
from src.api.project import router as project_router
from src.api.notifications import router as notifications_router

router = APIRouter(prefix="/api/v1")
router.include_router(auth_router, prefix="/auth")
router.include_router(user_router, prefix="/user")
router.include_router(project_router, prefix="/projects")
router.include_router(notifications_router, prefix="/notifications")
