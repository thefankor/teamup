from sqlalchemy.ext.asyncio import AsyncSession
from src.crud.impl import (
    UserDAO,
)


class Store:
    """Центральное хранилище данных для доступа к DAO объектам.

    Предоставляет единую точку доступа к различным DAO объектам через
    свойства. Использует ленивую инициализацию для создания DAO только
    при первом обращении. Интегрируется с сервисным слоем для выполнения
    бизнес-логики и операций с базой данных.

    Используется в:
    - Сервисном слое (ServiceImpl) для доступа к данным
    - Middleware для управления транзакциями
    - Эндпоинтах через dependency injection
    """

    def __init__(
        self,
        session: AsyncSession,
    ):
        """Инициализирует хранилище данных с асинхронной сессией.

        Args:
            session (AsyncSession): Асинхронная сессия SQLAlchemy для
                выполнения операций с базой данных.
        """
        self._session = session
        self._user_dao: UserDAO | None = None

    @property
    def user(self) -> UserDAO:
        """Возвращает интерфейс для работы с пользователями.

        Returns:
            UserInterface: Интерфейс для работы с пользователями.
        """
        if self._user_dao is None:
            self._user_dao = UserDAO(session=self._session)
        return self._user_dao
