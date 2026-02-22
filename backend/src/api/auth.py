from uuid import UUID

from fastapi import APIRouter, Depends
from src.core.dependencies import get_current_sid
from src.schemas import EmptyModel, LoginRequest, VerifyCodeRequest
from src.schemas.auth import RefreshTokenRequest, TokenInfo
from src.services.auth import AuthService

router = APIRouter(tags=["Auth"])


@router.post(
    "/login",
    summary="Login",
    description="Авторизация и регистрация в приложении соединена в один запрос.",
    response_model=EmptyModel,
    responses={
        400: {
            "description": "Неверное заполнение полей",
            "content": {
                "application/json": {"example": {"detail": "Неверное заполнение полей"}}
            },
        },
    },
)
async def auth_login(
    login_data: LoginRequest,
    auth_service: AuthService = Depends(),
):
    await auth_service.send_confirm_code(email=login_data.email)
    return {}


@router.post(
    "/verify",
    summary="Verify",
    description="Отправка кода и получение токена",
    responses={
        401: {
            "description": "Неверный код",
            "content": {"application/json": {"example": {"detail": "Неверный код"}}},
        },
    },
)
async def auth_verify(
    login_data: VerifyCodeRequest,
    auth_service: AuthService = Depends(),
) -> TokenInfo:
    response = await auth_service.verify_code(
        email=login_data.email, code=login_data.code
    )
    return response


@router.post("/refresh", response_model_exclude_none=True)
async def refresh_jwt(
    data: RefreshTokenRequest,
    service: AuthService = Depends(),
) -> TokenInfo:
    return await service.refresh_tokens(refresh_token=data.refresh_token)


@router.post(
    "/logout",
    response_model_exclude_none=True,
    responses={
        401: {
            "description": "Токен не валиден",
            "content": {
                "application/json": {"example": {"detail": "Токен не валиден"}}
            },
        },
    },
)
async def logout(
    sid: UUID = Depends(get_current_sid),
    service: AuthService = Depends(),
):
    return await service.logout(sid=sid)
