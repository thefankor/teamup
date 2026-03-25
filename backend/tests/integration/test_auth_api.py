import pytest
from fastapi import status


@pytest.mark.integration
@pytest.mark.asyncio
async def test_login_endpoint_normalizes_email_and_stores_code(
    client, confirm_code_service
):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "  USER@Example.COM "},
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {}
    assert "user@example.com" in confirm_code_service.codes


@pytest.mark.integration
@pytest.mark.asyncio
async def test_verify_endpoint_returns_tokens_for_saved_code(
    client, confirm_code_service
):
    confirm_code_service.codes["user@example.com"] = "12345"

    response = await client.post(
        "/api/v1/auth/verify",
        json={"email": "user@example.com", "code": "12345"},
    )

    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body["access_token"]
    assert body["refresh_token"]


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
