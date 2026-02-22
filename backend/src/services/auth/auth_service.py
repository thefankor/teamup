import random
from datetime import timedelta
from uuid import UUID

from fastapi import Depends, HTTPException
from src.config import settings
from src.core.auth import TokenService
from src.core.dependencies import get_store
from src.core.exceptions import InvalidCodeException
from src.crud import Store
from src.schemas.auth import TokenInfo
from src.tasks import send_code_task
from src.utils.confirm_code_service import ConfirmCodeService
from starlette import status


class AuthService:
    """
    Сервис для управления пользователями системы.

    Предоставляет бизнес-логику для работы с пользователями: создание,
    обновление, проверка статуса и управление языковыми настройками.
    Интегрируется с DAO слоем для выполнения операций с базой данных.

    Используется в:
    - Эндпоинтах пользователей для CRUD операций
    - AuthenticationService для проверки пользователей
    - ReferralService для создания реферальных связей
    """

    def __init__(
        self,
        store: Store = Depends(get_store),
        sms_service: ConfirmCodeService = Depends(),
    ):
        """Инициализация сервиса пользователей.

        Args:
            store: Хранилище данных, используемое для операций с пользователями.
        """
        self._store = store
        self._sms_service = sms_service

    async def send_confirm_code(self, email: str):
        code = self.generate_code()
        await self._sms_service.save(email=email, code=code)
        send_code_task.delay(to_email=email, code=str(code))

    async def verify_code(self, email: str, code: str) -> TokenInfo:
        is_success_code = await self._sms_service.verify(
            email=email, submitted_code=code
        )

        if not is_success_code:
            raise InvalidCodeException

        await self._sms_service.delete(email=email)

        user_id = await self._store.user.get_or_create(email=email)

        user_session = await self._store.user_session.add(
            return_model=True, user_id=user_id
        )

        data = {
            "sub": str(user_id),
            "sid": str(user_session.id),
            "ver": user_session.version,
        }

        return self.create_tokens(
            data=data,
        )

    @staticmethod
    def generate_code(length: int = 5) -> int:
        """Генерирует случайный цифровой код нужной длины (по умолчанию 5 цифр)."""
        min_val = 10 ** (length - 1)
        max_val = 10**length - 1
        return random.randint(min_val, max_val)

    @staticmethod
    def create_tokens(data: dict) -> TokenInfo:
        """Создание access и refresh токенов"""
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        access_token = TokenService.create_token(
            data=data,
            expires_delta=access_token_expires,
            secret_key=settings.ACCESS_SECRET_KEY,
        )

        refresh_token = TokenService.create_token(
            data=data,
            expires_delta=refresh_token_expires,
            secret_key=settings.REFRESH_SECRET_KEY,
        )

        return TokenInfo(
            access_token=access_token,
            refresh_token=refresh_token,
        )

    async def refresh_tokens(self, refresh_token: str) -> TokenInfo:
        """Обновление access токена с помощью refresh токена"""
        payload = TokenService.get_token_payload(refresh_token, is_refresh=True)
        sub = UUID(payload.get("sub"))
        sid = UUID(payload.get("sid"))
        ver: int = payload.get("ver")

        if not sub or not ver or not sid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
            )

        new_ver = await self._store.user_session.bump_version(
            session_id=sid, expected_version=ver
        )
        if not new_ver:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
            )

        data = {"sub": str(sub), "sid": str(sid), "ver": new_ver}
        return self.create_tokens(data)

    async def logout(self, sid: UUID):
        await self._store.user_session.update(
            model_id=sid, return_model=False, is_active=False
        )
