from uuid import UUID

from fastapi import Depends
from src.core.dependencies import get_store
from src.core.exceptions import NotFoundException
from src.crud import Store
from src.models import Project
from src.models.enums import ApplicationStatus as ModelApplicationStatus
from src.schemas.project import (
    Application,
    ApplicationCreate,
    ApplicationDecision,
    ApplicationsPage,
    ApplicationStatus,
    Level,
    ProjectCard,
    ProjectCreate,
    ProjectMember,
    ProjectSortField,
    ProjectsPage,
    ProjectStatus,
    ProjectUpdate,
    SortOrder,
)
from src.schemas.project import (
    Project as ProjectSchema,
)
from src.schemas.project import (
    ProjectPosition as ProjectPositionSchema,
)
from src.schemas.user import UserTypeEnum
from src.utils.s3_service import S3Service


class ProjectService:
    """Сервис для управления проектами.

    Предоставляет бизнес-логику для работы с проектами: создание,
    обновление, управление заявками и участниками.
    """

    def __init__(
        self,
        store: Store = Depends(get_store),
        s3: S3Service = Depends(),
    ):
        """Инициализация сервиса проектов.

        Args:
            store: Хранилище данных для операций с проектами.
        """
        self._store = store
        self._s3 = s3

    def _model_status_to_schema(self, is_open: bool) -> ProjectStatus:
        """Конвертирует is_open в ProjectStatus."""
        return ProjectStatus.open if is_open else ProjectStatus.closed

    def _schema_status_to_model(self, status: ProjectStatus) -> bool:
        """Конвертирует ProjectStatus в is_open."""
        return status == ProjectStatus.open

    def _model_app_status_to_schema(
        self, status: ModelApplicationStatus
    ) -> ApplicationStatus:
        """Конвертирует статус заявки из модели в схему."""
        mapping = {
            ModelApplicationStatus.PENDING: ApplicationStatus.pending,
            ModelApplicationStatus.APPROVED: ApplicationStatus.approved,
            ModelApplicationStatus.REJECTED: ApplicationStatus.rejected,
        }
        return mapping.get(status, ApplicationStatus.pending)

    def _schema_app_status_to_model(
        self, status: ApplicationStatus
    ) -> ModelApplicationStatus:
        """Конвертирует статус заявки из схемы в модель."""
        mapping = {
            ApplicationStatus.pending: ModelApplicationStatus.PENDING,
            ApplicationStatus.approved: ModelApplicationStatus.APPROVED,
            ApplicationStatus.rejected: ModelApplicationStatus.REJECTED,
        }
        return mapping.get(status, ModelApplicationStatus.PENDING)

    async def _get_project_with_relations(self, project_id: UUID) -> Project:
        """Получает проект со всеми связанными данными."""
        project = await self._store.project.find_by_id(model_id=project_id)
        if not project:
            raise NotFoundException
        return project

    async def _build_project_schema(self, project: Project) -> ProjectSchema:
        """Строит схему проекта из модели."""
        positions = await self._store.project_position.find_all(project_id=project.id)
        position_schemas = [
            ProjectPositionSchema(
                id=pos.id,
                role=pos.role,
                level=Level(pos.level),
                tags=[],
                is_open=True,
                created_at=pos.created_at,
            )
            for pos in positions
        ]

        participants = await self._store.project_participant.find_all(
            project_id=project.id
        )
        team_member_ids = set()
        team_members = []

        for participant in participants:
            user = await self._store.user.find_by_id(model_id=participant.user_id)
            if user:
                team_member_ids.add(user.id)
                user_applications = await self._store.project_application.find_all(
                    project_id=project.id, user_id=user.id
                )
                user_position_ids = {app.position_id for app in user_applications}
                user_roles = [
                    pos.role for pos in positions if pos.id in user_position_ids
                ]

                avatar_url = None
                if user.avatar_key:
                    avatar_url = await self._s3.presigned_get_url(key=user.avatar_key)

                team_members.append(
                    ProjectMember(
                        user_id=user.id,
                        user_type=UserTypeEnum(user.user_type.value),
                        full_name=f"{user.first_name or ''} {user.last_name or ''}".strip()
                        or "Unknown",
                        avatar_url=avatar_url,
                        roles=[participant.role] + user_roles,
                        tags=user.tags,
                        is_owner=user.id == project.owner_id,
                    )
                )

        if project.owner_id not in team_member_ids:
            owner = await self._store.user.find_by_id(model_id=project.owner_id)
            if owner:
                avatar_url = None
                if owner.avatar_key:
                    avatar_url = await self._s3.presigned_get_url(key=owner.avatar_key)

                team_members.append(
                    ProjectMember(
                        user_id=owner.id,
                        user_type=UserTypeEnum(owner.user_type.value),
                        full_name=f"{owner.first_name or ''} {owner.last_name or ''}".strip()
                        or "Unknown",
                        avatar_url=avatar_url,
                        roles=["Owner"],
                        tags=owner.tags,
                        is_owner=True,
                    )
                )

        return ProjectSchema(
            id=project.id,
            owner_id=project.owner_id,
            title=project.title,
            description=project.description,
            tags=project.tags,
            status=self._model_status_to_schema(project.is_open),
            created_at=project.created_at,
            updated_at=project.updated_at,
            team=team_members,
            positions=position_schemas,
        )

    async def list_open_projects(
        self,
        q: str | None = None,
        role: str | None = None,
        level: str | None = None,
        sort_by: ProjectSortField = ProjectSortField.created_at,
        order: SortOrder = SortOrder.desc,
        limit: int = 20,
        offset: int = 0,
    ) -> ProjectsPage:
        """Получает список открытых проектов с фильтрацией."""
        projects = await self._store.project.find_open_projects(
            q=q,
            role=role,
            level=level,
            sort_by=sort_by,
            order=order,
            limit=limit,
            offset=offset,
        )
        total = await self._store.project.count_open_projects(
            q=q,
            role=role,
            level=level,
        )

        items = [
            ProjectCard(
                id=project.id,
                title=project.title,
                excerpt=project.description[:200] if project.description else None,
                tags=project.tags,
                created_at=project.created_at,
            )
            for project in projects
        ]

        return ProjectsPage(items=items, total=total)

    async def get_project(self, project_id: UUID) -> ProjectSchema:
        """Получает проект по ID."""
        project = await self._get_project_with_relations(project_id)
        return await self._build_project_schema(project)

    async def my_projects(
        self,
        user_id: UUID,
        status: ProjectStatus | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> ProjectsPage:
        """Получает проекты пользователя."""
        is_open = None
        if status:
            is_open = self._schema_status_to_model(status)

        projects = await self._store.project.find_by_owner(
            owner_id=user_id, is_open=is_open, limit=limit, offset=offset
        )

        items = [
            ProjectCard(
                id=project.id,
                title=project.title,
                excerpt=project.description[:200] if project.description else None,
                tags=project.tags,
                created_at=project.created_at,
            )
            for project in projects
        ]

        return ProjectsPage(items=items)

    async def participating_projects(
        self,
        user_id: UUID,
        status: ProjectStatus | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> ProjectsPage:
        """Получает проекты, где пользователь является участником (но не владельцем)."""
        is_open = None
        if status:
            is_open = self._schema_status_to_model(status)

        # Находим все участия пользователя
        participants = await self._store.project_participant.find_projects_by_user(
            user_id=user_id
        )

        # Получаем ID проектов
        project_ids = [p.project_id for p in participants]

        if not project_ids:
            return ProjectsPage(items=[])

        # Загружаем проекты по ID
        projects = []
        for project_id in project_ids:
            project = await self._store.project.find_by_id(model_id=project_id)
            if project and project.owner_id != user_id:
                if is_open is None or project.is_open == is_open:
                    projects.append(project)

        # Сортируем и применяем пагинацию
        projects.sort(key=lambda p: p.created_at, reverse=True)
        paginated_projects = projects[offset : offset + limit]

        items = [
            ProjectCard(
                id=project.id,
                title=project.title,
                excerpt=project.description[:200] if project.description else None,
                tags=project.tags,
                created_at=project.created_at,
            )
            for project in paginated_projects
        ]

        return ProjectsPage(items=items)

    async def create_project(self, user_id: UUID, data: ProjectCreate) -> ProjectSchema:
        """Создает новый проект с позициями."""
        project = await self._store.project.add(
            title=data.title,
            description=data.description or "",
            tags=data.tags,
            is_open=True,
            owner_id=user_id,
        )

        for pos_data in data.positions:
            await self._store.project_position.add(
                project_id=project.id,
                name=pos_data.role,
                role=pos_data.role,
                level=pos_data.level.value,
            )

        return await self._build_project_schema(project)

    async def update_project(
        self, project_id: UUID, user_id: UUID, data: ProjectUpdate
    ) -> ProjectSchema:
        """Обновляет проект. Только владелец."""
        project = await self._get_project_with_relations(project_id)

        if project.owner_id != user_id:
            raise NotFoundException

        update_data = data.model_dump(exclude_unset=True)
        if "status" in update_data:
            update_data["is_open"] = self._schema_status_to_model(
                update_data.pop("status")
            )

        await self._store.project.update(
            model_id=project_id, return_model=False, **update_data
        )

        updated_project = await self._get_project_with_relations(project_id)
        return await self._build_project_schema(updated_project)

    async def set_status(
        self, project_id: UUID, user_id: UUID, status: ProjectStatus
    ) -> ProjectSchema:
        """Изменяет статус проекта. Только владелец."""
        project = await self._get_project_with_relations(project_id)

        if project.owner_id != user_id:
            raise NotFoundException

        is_open = self._schema_status_to_model(status)
        await self._store.project.update(
            model_id=project_id, return_model=False, is_open=is_open
        )

        updated_project = await self._get_project_with_relations(project_id)
        return await self._build_project_schema(updated_project)

    async def delete_project(self, project_id: UUID, user_id: UUID) -> None:
        """Удаляет проект. Только владелец."""
        project = await self._get_project_with_relations(project_id)

        if project.owner_id != user_id:
            raise NotFoundException

        await self._store.project.delete(model_id=project_id)

    async def submit_application(
        self, project_id: UUID, user_id: UUID, data: ApplicationCreate
    ) -> Application:
        """Подает заявку на проект для указанных позиций."""

        applications = []
        for position_id in data.position_ids:
            position = await self._store.project_position.find_one_or_none(
                id=position_id, project_id=project_id
            )
            if not position:
                raise NotFoundException

            existing = await self._store.project_application.find_one_or_none(
                project_id=project_id, position_id=position_id, user_id=user_id
            )
            if existing:
                continue

            app = await self._store.project_application.add(
                project_id=project_id,
                position_id=position_id,
                user_id=user_id,
                message=data.message,
                status=ModelApplicationStatus.PENDING,
            )
            applications.append(app)

        if not applications:
            raise NotFoundException

        return Application(
            id=applications[0].id,
            project_id=project_id,
            applicant_id=user_id,
            position_ids=data.position_ids,
            message=applications[0].message,
            status=self._model_app_status_to_schema(applications[0].status),
            created_at=applications[0].created_at,
            decided_at=None,
            decided_by=None,
        )

    async def withdraw_application(
        self, project_id: UUID, application_id: UUID, user_id: UUID
    ) -> Application:
        """Отзывает заявку пользователя."""
        application = await self._store.project_application.find_one_or_none(
            id=application_id, project_id=project_id, user_id=user_id
        )
        if not application:
            raise NotFoundException

        await self._store.project_application.delete(model_id=application_id)

        return Application(
            id=application.id,
            project_id=project_id,
            applicant_id=user_id,
            position_ids=[application.position_id],
            message=application.message,
            status=ApplicationStatus.withdrawn,
            created_at=application.created_at,
            decided_at=None,
            decided_by=None,
        )

    async def list_applications(
        self,
        project_id: UUID,
        user_id: UUID,
        status_filter: ApplicationStatus | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> ApplicationsPage:
        """Получает список заявок на проект. Только владелец."""
        project = await self._get_project_with_relations(project_id)
        if project.owner_id != user_id:
            raise NotFoundException

        model_status = None
        if status_filter:
            model_status = self._schema_app_status_to_model(status_filter)

        applications = await self._store.project_application.find_by_project(
            project_id=project_id, status=model_status, limit=limit, offset=offset
        )

        items = []
        for app in applications:
            items.append(
                Application(
                    id=app.id,
                    project_id=project_id,
                    applicant_id=app.user_id,
                    position_ids=[app.position_id],
                    message=app.message,
                    status=self._model_app_status_to_schema(app.status),
                    created_at=app.created_at,
                    decided_at=app.updated_at
                    if app.status != ModelApplicationStatus.PENDING
                    else None,
                    decided_by=project.owner_id
                    if app.status != ModelApplicationStatus.PENDING
                    else None,
                )
            )

        return ApplicationsPage(items=items)

    async def decide_application(
        self,
        project_id: UUID,
        application_id: UUID,
        user_id: UUID,
        data: ApplicationDecision,
    ) -> Application:
        """Принимает решение по заявке. Только владелец."""
        project = await self._get_project_with_relations(project_id)
        if project.owner_id != user_id:
            raise NotFoundException

        application = await self._store.project_application.find_one_or_none(
            id=application_id, project_id=project_id
        )
        if not application:
            raise NotFoundException

        new_status = (
            ModelApplicationStatus.APPROVED
            if data.approve
            else ModelApplicationStatus.REJECTED
        )

        await self._store.project_application.update(
            model_id=application_id,
            return_model=False,
            status=new_status,
            note=data.note,
        )

        if data.approve:
            existing_participant = (
                await self._store.project_participant.find_one_or_none(
                    project_id=project_id, user_id=application.user_id
                )
            )
            if not existing_participant:
                position = await self._store.project_position.find_by_id(
                    model_id=application.position_id
                )
                if position:
                    await self._store.project_participant.add(
                        project_id=project_id,
                        user_id=application.user_id,
                        role=position.role,
                    )

        updated_application = await self._store.project_application.find_by_id(
            model_id=application_id
        )

        return Application(
            id=updated_application.id,
            project_id=project_id,
            applicant_id=updated_application.user_id,
            position_ids=[updated_application.position_id],
            message=updated_application.message,
            status=self._model_app_status_to_schema(updated_application.status),
            created_at=updated_application.created_at,
            decided_at=updated_application.updated_at,
            decided_by=user_id,
        )
