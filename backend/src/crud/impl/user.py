from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from src.core.wrapper import handle_db_errors
from src.crud.impl.base import BaseDAO
from src.models import User


class UserDAO(BaseDAO):
    """DAO для работы с пользователями.

    Предоставляет методы для управления пользователями, проверки
    их статуса, создания новых пользователей и получения информации.

    Используется в:
    - UserService для бизнес-логики пользователей
    - AuthenticationService для проверки пользователей
    """

    model = User

    @handle_db_errors
    async def get_or_create(self, email: str) -> int:
        """Возвращает ID пользователя, создаёт при отсутствии."""
        # norm_email = email.strip().lower()

        # 1. Проверяем, есть ли пользователь
        result = await self.session.execute(
            select(self.model.id).where(self.model.email == email)
        )
        user_id = result.scalar_one_or_none()
        if user_id:
            return user_id

        # 2. Пытаемся создать нового
        user = self.model(email=email)
        self.session.add(user)

        try:
            await self.session.flush()
        except IntegrityError:
            await self.session.rollback()
            result = await self.session.execute(
                select(self.model.id).where(self.model.email == email)
            )
            user_id = result.scalar_one()
            return user_id

        return user.id

    @handle_db_errors
    async def get_avatar_key_by_id(self, model_id: UUID):
        query = select(self.model.avatar_key).filter_by(id=model_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
