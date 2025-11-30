from uuid import UUID

from sqlalchemy import select
from src.core.wrapper import handle_db_errors
from src.crud.impl.base import BaseDAO
from src.models import ProjectApplication
from src.models.enums import ApplicationStatus


class ProjectApplicationDAO(BaseDAO):
    model = ProjectApplication

    @handle_db_errors
    async def find_by_project(
        self,
        project_id: UUID,
        status: ApplicationStatus | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[ProjectApplication]:
        """Находит заявки по проекту с фильтрацией по статусу."""
        query = select(self.model).where(self.model.project_id == project_id)

        if status:
            query = query.where(self.model.status == status)

        query = query.order_by(self.model.created_at.desc()).limit(limit).offset(offset)

        result = await self.session.execute(query)
        return list(result.scalars().all())
