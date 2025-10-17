from uuid import UUID

from fastapi import APIRouter, Depends
from src.core.dependencies import get_current_user
from src.schemas.project import (
    Application,
    ApplicationCreate,
    ApplicationDecision,
    ApplicationsPage,
    ApplicationStatus,
    Project,
    ProjectCreate,
    ProjectsPage,
    ProjectStatus,
    ProjectUpdate,
)
from starlette import status

router = APIRouter(tags=["Projects"])


@router.get("", response_model=ProjectsPage)
async def list_open_projects(
    q: str | None = None,
    role_tags: str | None = None,
    limit: int = 20,
    offset: str | None = None,
) -> ProjectsPage:
    pass


@router.get("/{project_id}", response_model=Project)
async def get_project(project_id: UUID):
    pass


@router.get("/me/list", response_model=ProjectsPage)
async def my_projects(
    status: ProjectStatus | None = None,
    limit: int = 20,
    cursor: str | None = None,
    user=Depends(get_current_user),
):
    pass


@router.post("", response_model=Project, status_code=status.HTTP_201_CREATED)
async def create_project(payload: ProjectCreate, user=Depends(get_current_user)):
    pass


@router.patch("/{project_id}", response_model=Project)
async def update_project(
    project_id: UUID, payload: ProjectUpdate, user=Depends(get_current_user)
):
    pass


@router.put("/{project_id}/status/{status}", response_model=Project)
async def set_status(
    project_id: UUID, status: ProjectStatus, user=Depends(get_current_user)
):
    pass


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: UUID, user=Depends(get_current_user)):
    pass


@router.post(
    "/{project_id}/applications",
    response_model=Application,
    status_code=status.HTTP_201_CREATED,
)
async def submit_application(
    project_id: UUID,
    payload: ApplicationCreate,
    user=Depends(get_current_user),
):
    pass


@router.post(
    "/{project_id}/applications/{application_id}/withdraw", response_model=Application
)
async def withdraw_application(
    project_id: UUID, application_id: UUID, user=Depends(get_current_user)
):
    pass


@router.get("/{project_id}/applications", response_model=ApplicationsPage)
async def list_applications(
    project_id: UUID,
    status_filter: ApplicationStatus | None = None,
    limit: int = 20,
    cursor: str | None = None,
    user=Depends(get_current_user),
):
    pass


@router.post(
    "/{project_id}/applications/{application_id}/decision", response_model=Application
)
async def decide_application(
    project_id: UUID,
    application_id: UUID,
    payload: ApplicationDecision,
    user=Depends(get_current_user),
):
    pass
