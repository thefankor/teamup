from uuid import UUID

from sqlalchemy import select, update
from src.core.wrapper import handle_db_errors
from src.crud.impl.base import BaseDAO
from src.models import Session


class SessionDAO(BaseDAO):
    model = Session

    @handle_db_errors
    async def bump_version(
        self,
        session_id: UUID,
        expected_version: int,
    ) -> int | None:
        """
        CAS (compare-and-swap) обновление версии сессии.
        Возвращает новую версию или None, если версия не совпала.
        """
        stmt = (
            update(self.model)
            .where(self.model.id == session_id, self.model.version == expected_version)
            .values(version=self.model.version + 1)
            .returning(self.model.version)
        )

        result = await self.session.execute(stmt)
        new_version = result.scalar_one_or_none()
        return new_version

    @handle_db_errors
    async def check_session_and_get_user_id(self, model_id: UUID, version: int) -> UUID:
        stmt = (
            select(self.model.user_id)
            .where(self.model.id == model_id)
            .where(self.model.version == version)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    @handle_db_errors
    async def check_exist_and_active(self, model_id: int | UUID):
        """Проверяет существование записи активной сессии по ID и возвращает True или False

        Используется для валидации существования записей перед
        выполнением операций обновления или удаления.

        Args:
            model_id (int | UUID): Идентификатор записи для проверки.

        Returns:
            bool: True, если запись существует, иначе False
        """
        stmt = (
            select(self.model.id)
            .where(self.model.id == model_id)
            .where(self.model.is_active.is_(True))
        )
        result = await self.session.execute(stmt)
        instance = result.scalar_one_or_none()
        return True if instance else False
