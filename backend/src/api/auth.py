from fastapi import APIRouter, Depends

from src.schemas import AuthResponse, LoginRequest, VerifyCodeRequest, EmptyModel
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
) -> AuthResponse:
    response = await auth_service.verify_code(
        email=login_data.email, code=login_data.code
    )
    return response
