from uuid import UUID

from sqlalchemy import select
from src.core.wrapper import handle_db_errors
from src.crud.impl.base import BaseDAO
from src.models import Project


class ProjectDAO(BaseDAO):
    model = Project

    @handle_db_errors
    async def find_open_projects(
        self, q: str | None = None, limit: int = 20, offset: int = 0
    ) -> list[Project]:
        """Находит открытые проекты с поиском по тексту."""
        query = select(self.model).where(self.model.is_open.is_(True))

        if q:
            query = query.where(
                (self.model.title.ilike(f"%{q}%"))
                | (self.model.description.ilike(f"%{q}%"))
            )

        query = query.order_by(self.model.created_at.desc()).limit(limit).offset(offset)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    @handle_db_errors
    async def find_by_owner(
        self,
        owner_id: UUID,
        is_open: bool | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[Project]:
        """Находит проекты по владельцу с фильтрацией по статусу."""
        query = select(self.model).where(self.model.owner_id == owner_id)

        if is_open is not None:
            query = query.where(self.model.is_open == is_open)

        query = query.order_by(self.model.created_at.desc()).limit(limit).offset(offset)

        result = await self.session.execute(query)
        return list(result.scalars().all())
