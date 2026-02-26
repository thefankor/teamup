from sqlalchemy.ext.asyncio import AsyncSession
from src.crud.impl import (
    NotificationDAO,
    ProjectApplicationDAO,
    ProjectDAO,
    ProjectParticipantDAO,
    ProjectPositionDAO,
    UserDAO,
    UserEducationDAO,
)
from src.crud.impl.sessions import SessionDAO


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
        self._user_session: SessionDAO | None = None
        self._user_education_dao: UserEducationDAO | None = None
        self._project_dao: ProjectDAO | None = None
        self._project_position_dao: ProjectPositionDAO | None = None
        self._project_application_dao: ProjectApplicationDAO | None = None
        self._project_participant_dao: ProjectParticipantDAO | None = None
        self._notification_dao: NotificationDAO | None = None

    @property
    def user(self) -> UserDAO:
        """Возвращает интерфейс для работы с пользователями.

        Returns:
            UserDAO: Интерфейс для работы с пользователями.
        """
        if self._user_dao is None:
            self._user_dao = UserDAO(session=self._session)
        return self._user_dao

    @property
    def user_education(self) -> UserEducationDAO:
        """Возвращает интерфейс для работы с образованием пользователей.

        Returns:
            UserEducationDAO: Интерфейс для работы с образованием пользователей.
        """
        if self._user_education_dao is None:
            self._user_education_dao = UserEducationDAO(session=self._session)
        return self._user_education_dao

    @property
    def project(self) -> ProjectDAO:
        """Возвращает интерфейс для работы с проектами.

        Returns:
            ProjectDAO: Интерфейс для работы с проектами.
        """
        if self._project_dao is None:
            self._project_dao = ProjectDAO(session=self._session)
        return self._project_dao

    @property
    def project_position(self) -> ProjectPositionDAO:
        """Возвращает интерфейс для работы с позициями в проектах.

        Returns:
            ProjectPositionDAO: Интерфейс для работы с позициями в проектах.
        """
        if self._project_position_dao is None:
            self._project_position_dao = ProjectPositionDAO(session=self._session)
        return self._project_position_dao

    @property
    def project_application(self) -> ProjectApplicationDAO:
        """Возвращает интерфейс для работы с заявками на проекты.

        Returns:
            ProjectApplicationDAO: Интерфейс для работы с заявками на проекты.
        """
        if self._project_application_dao is None:
            self._project_application_dao = ProjectApplicationDAO(session=self._session)
        return self._project_application_dao

    @property
    def project_participant(self) -> ProjectParticipantDAO:
        """Возвращает интерфейс для работы с участниками проектов.

        Returns:
            ProjectParticipantDAO: Интерфейс для работы с участниками проектов.
        """
        if self._project_participant_dao is None:
            self._project_participant_dao = ProjectParticipantDAO(session=self._session)
        return self._project_participant_dao

    @property
    def notification(self) -> NotificationDAO:
        """Возвращает интерфейс для работы с уведомлениями.

        Returns:
            NotificationDAO: Интерфейс для работы с уведомлениями.
        """
        if self._notification_dao is None:
            self._notification_dao = NotificationDAO(session=self._session)
        return self._notification_dao

    @property
    def user_session(self) -> SessionDAO:
        """
        Возвращает интерфейс для работы с сессиями пользователей.

        Returns:
            SessionDAO: Интерфейс для работы с сессиями.
        """
        if self._user_session is None:
            self._user_session = SessionDAO(session=self._session)
        return self._user_session
