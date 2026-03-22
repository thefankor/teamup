from datetime import timedelta
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException
from src.core.auth.token import TokenService
from src.core.dependencies import require_permission
from src.models.enums import UserType


@pytest.mark.unit
def test_token_service_round_trip_returns_payload():
    payload = {"sub": str(uuid4()), "sid": str(uuid4()), "ver": 1}

    token = TokenService.create_token(
        data=payload,
        expires_delta=timedelta(minutes=5),
        secret_key="test-access-secret",
    )

    decoded = TokenService.get_token_payload(token)

    assert decoded["sub"] == payload["sub"]
    assert decoded["sid"] == payload["sid"]
    assert decoded["ver"] == payload["ver"]


@pytest.mark.unit
def test_token_service_rejects_invalid_token():
    with pytest.raises(HTTPException) as exc:
        TokenService.get_token_payload("broken-token")

    assert exc.value.status_code == 401
    assert exc.value.detail["message"] == "Could not validate credentials"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_require_permission_rejects_user_without_permission():
    dependency = require_permission("users:manage_user_types")
    current_user = SimpleNamespace(id=uuid4(), user_type=UserType.USER)

    with pytest.raises(HTTPException) as exc:
        await dependency(current_user=current_user)

    assert exc.value.status_code == 403


@pytest.mark.unit
@pytest.mark.asyncio
async def test_require_permission_allows_admin():
    dependency = require_permission("users:manage_user_types")
    admin = SimpleNamespace(id=uuid4(), user_type=UserType.ADMIN)

    result = await dependency(current_user=admin)

    assert result == admin.id
