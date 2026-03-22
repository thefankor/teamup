from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from fastapi import HTTPException
from src.core.exceptions import InvalidCodeException
from src.schemas.auth import TokenInfo
from src.services.auth.auth_service import AuthService


@pytest.mark.unit
@pytest.mark.asyncio
async def test_send_confirm_code_saves_code_and_dispatches_task(monkeypatch):
    sms_service = AsyncMock()
    store = SimpleNamespace()
    sent = {}

    service = AuthService(store=store, sms_service=sms_service)
    monkeypatch.setattr(
        AuthService,
        "generate_code",
        staticmethod(lambda length=5: 12345),
    )
    monkeypatch.setattr(
        "src.services.auth.auth_service.send_code_task.delay",
        lambda **kwargs: sent.update(kwargs),
    )

    await service.send_confirm_code("USER@Example.COM")

    sms_service.save.assert_awaited_once_with(email="USER@Example.COM", code=12345)
    assert sent == {"to_email": "USER@Example.COM", "code": "12345"}


@pytest.mark.unit
@pytest.mark.asyncio
async def test_verify_code_raises_when_code_is_invalid():
    sms_service = AsyncMock()
    sms_service.verify.return_value = False
    store = SimpleNamespace()
    service = AuthService(store=store, sms_service=sms_service)

    with pytest.raises(InvalidCodeException):
        await service.verify_code(email="user@example.com", code="00000")

    sms_service.delete.assert_not_called()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_verify_code_returns_tokens_for_valid_code(monkeypatch):
    user_id = uuid4()
    session_id = uuid4()
    sms_service = AsyncMock()
    sms_service.verify.return_value = True
    store = SimpleNamespace(
        user=SimpleNamespace(get_or_create=AsyncMock(return_value=user_id)),
        user_session=SimpleNamespace(
            add=AsyncMock(
                return_value=SimpleNamespace(id=session_id, version=1),
            )
        ),
    )
    service = AuthService(store=store, sms_service=sms_service)

    monkeypatch.setattr(
        AuthService,
        "create_tokens",
        staticmethod(
            lambda data: TokenInfo(
                access_token=f"access-{data['sid']}",
                refresh_token=f"refresh-{data['ver']}",
            )
        ),
    )

    result = await service.verify_code(email="user@example.com", code="12345")

    sms_service.delete.assert_awaited_once_with(email="user@example.com")
    store.user.get_or_create.assert_awaited_once_with(email="user@example.com")
    store.user_session.add.assert_awaited_once_with(
        return_model=True,
        user_id=user_id,
    )
    assert result.access_token == f"access-{session_id}"
    assert result.refresh_token == "refresh-1"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_refresh_tokens_bumps_session_version_and_returns_new_pair(monkeypatch):
    session_id = uuid4()
    user_id = uuid4()
    store = SimpleNamespace(
        user_session=SimpleNamespace(
            bump_version=AsyncMock(return_value=2),
        )
    )
    service = AuthService(store=store, sms_service=AsyncMock())

    monkeypatch.setattr(
        "src.services.auth.auth_service.TokenService.get_token_payload",
        lambda token, is_refresh=True: {
            "sub": str(user_id),
            "sid": str(session_id),
            "ver": 1,
        },
    )
    monkeypatch.setattr(
        AuthService,
        "create_tokens",
        staticmethod(
            lambda data: TokenInfo(
                access_token=f"access-{data['ver']}",
                refresh_token=f"refresh-{data['ver']}",
            )
        ),
    )

    result = await service.refresh_tokens("refresh-token")

    store.user_session.bump_version.assert_awaited_once_with(
        session_id=session_id,
        expected_version=1,
    )
    assert result.access_token == "access-2"
    assert result.refresh_token == "refresh-2"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_refresh_tokens_rejects_invalid_session(monkeypatch):
    session_id = uuid4()
    user_id = uuid4()
    store = SimpleNamespace(
        user_session=SimpleNamespace(
            bump_version=AsyncMock(return_value=None),
        )
    )
    service = AuthService(store=store, sms_service=AsyncMock())

    monkeypatch.setattr(
        "src.services.auth.auth_service.TokenService.get_token_payload",
        lambda token, is_refresh=True: {
            "sub": str(user_id),
            "sid": str(session_id),
            "ver": 3,
        },
    )

    with pytest.raises(HTTPException) as exc:
        await service.refresh_tokens("refresh-token")

    assert exc.value.status_code == 401
    assert exc.value.detail == "Invalid token"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_logout_deactivates_session():
    session_id = uuid4()
    store = SimpleNamespace(
        user_session=SimpleNamespace(update=AsyncMock()),
    )
    service = AuthService(store=store, sms_service=AsyncMock())

    await service.logout(session_id)

    store.user_session.update.assert_awaited_once_with(
        model_id=session_id,
        return_model=False,
        is_active=False,
    )
