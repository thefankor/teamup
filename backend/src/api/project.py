from uuid import UUID

from fastapi import APIRouter, Depends
from src.core.dependencies import get_current_user_id
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
from src.services.project import ProjectService
from starlette import status

router = APIRouter(tags=["Projects"])


@router.get("", response_model=ProjectsPage)
async def list_open_projects(
    q: str | None = None,
    limit: int = 20,
    offset: int = 0,
    service: ProjectService = Depends(),
) -> ProjectsPage:
    return await service.list_open_projects(q=q, limit=limit, offset=offset)


@router.get("/{project_id}", response_model=Project)
async def get_project(
    project_id: UUID,
    service: ProjectService = Depends(),
):
    return await service.get_project(project_id=project_id)


@router.get("/me/list", response_model=ProjectsPage)
async def my_projects(
    status: ProjectStatus | None = None,
    limit: int = 20,
    offset: int = 0,
    current_user_id: UUID = Depends(get_current_user_id),
    service: ProjectService = Depends(),
):
    return await service.my_projects(
        user_id=current_user_id, status=status, limit=limit, offset=offset
    )


@router.post("", response_model=Project, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate,
    current_user_id: UUID = Depends(get_current_user_id),
    service: ProjectService = Depends(),
):
    return await service.create_project(user_id=current_user_id, data=payload)


@router.patch("/{project_id}", response_model=Project)
async def update_project(
    project_id: UUID,
    payload: ProjectUpdate,
    current_user_id: UUID = Depends(get_current_user_id),
    service: ProjectService = Depends(),
):
    return await service.update_project(
        project_id=project_id, user_id=current_user_id, data=payload
    )


@router.put("/{project_id}/status/{status}", response_model=Project)
async def set_status(
    project_id: UUID,
    status: ProjectStatus,
    current_user_id: UUID = Depends(get_current_user_id),
    service: ProjectService = Depends(),
):
    return await service.set_status(
        project_id=project_id, user_id=current_user_id, status=status
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    service: ProjectService = Depends(),
):
    await service.delete_project(project_id=project_id, user_id=current_user_id)


@router.post(
    "/{project_id}/applications",
    response_model=Application,
    status_code=status.HTTP_201_CREATED,
)
async def submit_application(
    project_id: UUID,
    payload: ApplicationCreate,
    current_user_id: UUID = Depends(get_current_user_id),
    service: ProjectService = Depends(),
):
    return await service.submit_application(
        project_id=project_id, user_id=current_user_id, data=payload
    )


@router.post(
    "/{project_id}/applications/{application_id}/withdraw", response_model=Application
)
async def withdraw_application(
    project_id: UUID,
    application_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    service: ProjectService = Depends(),
):
    return await service.withdraw_application(
        project_id=project_id, application_id=application_id, user_id=current_user_id
    )


@router.get("/{project_id}/applications", response_model=ApplicationsPage)
async def list_applications(
    project_id: UUID,
    status_filter: ApplicationStatus | None = None,
    limit: int = 20,
    offset: int = 0,
    current_user_id: UUID = Depends(get_current_user_id),
    service: ProjectService = Depends(),
):
    return await service.list_applications(
        project_id=project_id,
        user_id=current_user_id,
        status_filter=status_filter,
        limit=limit,
        offset=offset,
    )


@router.post(
    "/{project_id}/applications/{application_id}/decision", response_model=Application
)
async def decide_application(
    project_id: UUID,
    application_id: UUID,
    payload: ApplicationDecision,
    current_user_id: UUID = Depends(get_current_user_id),
    service: ProjectService = Depends(),
):
    return await service.decide_application(
        project_id=project_id,
        application_id=application_id,
        user_id=current_user_id,
        data=payload,
    )
