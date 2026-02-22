from uuid import UUID

from sqlalchemy import select
from src.core.wrapper import handle_db_errors
from src.crud.impl.base import BaseDAO
from src.models import ProjectParticipant


class ProjectParticipantDAO(BaseDAO):
    model = ProjectParticipant

    @handle_db_errors
    async def find_projects_by_user(self, user_id: UUID) -> list[ProjectParticipant]:
        """Находит все проекты, где пользователь является участником."""
        query = select(self.model).where(self.model.user_id == user_id)
        result = await self.session.execute(query)
        return list(result.scalars().all())
