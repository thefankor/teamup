from uuid import UUID

from fastapi import APIRouter, Depends
from src.core.dependencies import require_permission
from src.core.permissions import (
    APPLICATIONS_DECIDE_ON_OWN_PROJECT,
    APPLICATIONS_LIST_ON_OWN_PROJECT,
    APPLICATIONS_SUBMIT,
    APPLICATIONS_WITHDRAW_OWN,
    PROJECTS_CREATE,
    PROJECTS_DELETE_OWN,
    PROJECTS_LIST_OWN,
    PROJECTS_LIST_PARTICIPATING,
    PROJECTS_SET_STATUS_OWN,
    PROJECTS_UPDATE_OWN,
)
from src.schemas.project import (
    Application,
    ApplicationCreate,
    ApplicationDecision,
    ApplicationsPage,
    ApplicationStatus,
    Project,
    ProjectCreate,
    ProjectSortField,
    ProjectsPage,
    ProjectStatus,
    ProjectUpdate,
    SortOrder,
)
from src.services.project import ProjectService
from starlette import status

router = APIRouter(tags=["Projects"])


@router.get("", response_model=ProjectsPage)
async def list_open_projects(
    q: str | None = None,
    role: str | None = None,
    level: str | None = None,
    sort_by: ProjectSortField = ProjectSortField.created_at,
    order: SortOrder = SortOrder.desc,
    limit: int = 20,
    offset: int = 0,
    service: ProjectService = Depends(),
) -> ProjectsPage:
    return await service.list_open_projects(
        q=q,
        role=role,
        level=level,
        sort_by=sort_by,
        order=order,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{project_id}",
    response_model=Project,
    responses={
        404: {"description": "Проект не найден"},
    },
)
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
    current_user_id: UUID = Depends(require_permission(PROJECTS_LIST_OWN)),
    service: ProjectService = Depends(),
):
    return await service.my_projects(
        user_id=current_user_id, status=status, limit=limit, offset=offset
    )


@router.get("/me/participating", response_model=ProjectsPage)
async def participating_projects(
    status: ProjectStatus | None = None,
    limit: int = 20,
    offset: int = 0,
    current_user_id: UUID = Depends(require_permission(PROJECTS_LIST_PARTICIPATING)),
    service: ProjectService = Depends(),
):
    return await service.participating_projects(
        user_id=current_user_id, status=status, limit=limit, offset=offset
    )


@router.post("", response_model=Project, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate,
    current_user_id: UUID = Depends(require_permission(PROJECTS_CREATE)),
    service: ProjectService = Depends(),
):
    return await service.create_project(user_id=current_user_id, data=payload)


@router.patch(
    "/{project_id}",
    response_model=Project,
    responses={
        403: {"description": "Нет доступа к изменению проекта"},
        404: {"description": "Проект не найден"},
    },
)
async def update_project(
    project_id: UUID,
    payload: ProjectUpdate,
    current_user_id: UUID = Depends(require_permission(PROJECTS_UPDATE_OWN)),
    service: ProjectService = Depends(),
):
    return await service.update_project(
        project_id=project_id, user_id=current_user_id, data=payload
    )


@router.put(
    "/{project_id}/status/{status}",
    response_model=Project,
    responses={
        403: {"description": "Нет доступа к изменению статуса проекта"},
        404: {"description": "Проект не найден"},
    },
)
async def set_status(
    project_id: UUID,
    status: ProjectStatus,
    current_user_id: UUID = Depends(require_permission(PROJECTS_SET_STATUS_OWN)),
    service: ProjectService = Depends(),
):
    return await service.set_status(
        project_id=project_id, user_id=current_user_id, status=status
    )


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        403: {"description": "Нет доступа к удалению проекта"},
        404: {"description": "Проект не найден"},
    },
)
async def delete_project(
    project_id: UUID,
    current_user_id: UUID = Depends(require_permission(PROJECTS_DELETE_OWN)),
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
    current_user_id: UUID = Depends(require_permission(APPLICATIONS_SUBMIT)),
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
    current_user_id: UUID = Depends(require_permission(APPLICATIONS_WITHDRAW_OWN)),
    service: ProjectService = Depends(),
):
    return await service.withdraw_application(
        project_id=project_id, application_id=application_id, user_id=current_user_id
    )


@router.get(
    "/{project_id}/applications",
    response_model=ApplicationsPage,
    responses={
        403: {"description": "Нет доступа к заявкам проекта"},
        404: {"description": "Проект не найден"},
    },
)
async def list_applications(
    project_id: UUID,
    status_filter: ApplicationStatus | None = None,
    limit: int = 20,
    offset: int = 0,
    current_user_id: UUID = Depends(
        require_permission(APPLICATIONS_LIST_ON_OWN_PROJECT)
    ),
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
    "/{project_id}/applications/{application_id}/decision",
    response_model=Application,
    responses={
        403: {"description": "Нет доступа к заявкам проекта"},
        404: {"description": "Проект или заявка не найдены"},
    },
)
async def decide_application(
    project_id: UUID,
    application_id: UUID,
    payload: ApplicationDecision,
    current_user_id: UUID = Depends(
        require_permission(APPLICATIONS_DECIDE_ON_OWN_PROJECT)
    ),
    service: ProjectService = Depends(),
):
    return await service.decide_application(
        project_id=project_id,
        application_id=application_id,
        user_id=current_user_id,
        data=payload,
    )
