from unittest.mock import AsyncMock

import pytest
from fastapi import status
from src.schemas.auth import TokenInfo
from src.services.auth.auth_service import AuthService


@pytest.mark.integration
@pytest.mark.asyncio
async def test_login_endpoint_normalizes_email_and_returns_empty_payload(client):
    service = AsyncMock(spec=AuthService)

    from main import app

    app.dependency_overrides[AuthService] = lambda: service

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "  USER@Example.COM "},
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {}
    service.send_confirm_code.assert_awaited_once_with(email="user@example.com")


@pytest.mark.integration
@pytest.mark.asyncio
async def test_verify_endpoint_returns_token_structure(client):
    service = AsyncMock(spec=AuthService)
    service.verify_code.return_value = TokenInfo(
        access_token="access-token",
        refresh_token="refresh-token",
    )

    from main import app

    app.dependency_overrides[AuthService] = lambda: service

    response = await client.post(
        "/api/v1/auth/verify",
        json={"email": "user@example.com", "code": "12345"},
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {
        "access_token": "access-token",
        "refresh_token": "refresh-token",
    }


@pytest.mark.integration
@pytest.mark.asyncio
async def test_refresh_endpoint_validates_required_payload(client):
    response = await client.post("/api/v1/auth/refresh", json={})

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    body = response.json()
    assert body["detail"][0]["loc"] == ["body", "refresh_token"]


@pytest.mark.integration
@pytest.mark.asyncio
async def test_login_endpoint_rejects_invalid_email(client):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "not-an-email"},
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
