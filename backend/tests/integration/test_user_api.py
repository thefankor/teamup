import pytest
from fastapi import status


@pytest.mark.integration
@pytest.mark.asyncio
async def test_get_profile_returns_structured_payload(
    client, seeded_users, auth_token_factory
):
    tokens = await auth_token_factory(seeded_users.owner.id)

    response = await client.get(
        "/api/v1/user",
        headers={"Authorization": f"Bearer {tokens.access_token}"},
    )

    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body["id"] == str(seeded_users.owner.id)
    assert body["contact_info"]["email"] == "owner@example.com"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_put_tags_rejects_duplicate_values_case_insensitively(
    client, seeded_users, auth_token_factory
):
    tokens = await auth_token_factory(seeded_users.owner.id)

    response = await client.put(
        "/api/v1/user/tags",
        headers={"Authorization": f"Bearer {tokens.access_token}"},
        json={"tags": ["Python", "python"]},
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.integration
@pytest.mark.asyncio
async def test_get_profile_by_id_forbidden_for_regular_user(
    client, seeded_users, auth_token_factory
):
    tokens = await auth_token_factory(seeded_users.owner.id)

    response = await client.get(
        f"/api/v1/user/{seeded_users.admin.id}",
        headers={"Authorization": f"Bearer {tokens.access_token}"},
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.integration
@pytest.mark.asyncio
async def test_avatar_upload_url_endpoint_returns_expected_shape(
    client, seeded_users, auth_token_factory
):
    tokens = await auth_token_factory(seeded_users.owner.id)

    response = await client.post(
        "/api/v1/user/avatar/upload-url",
        params={"content_type": "image/png"},
        headers={"Authorization": f"Bearer {tokens.access_token}"},
    )

    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert (
        body["upload_url"]
        == f"https://storage.test/upload/users/{seeded_users.owner.id}/avatar/test-avatar.png"
    )
    assert body["object_key"].endswith("/avatar/test-avatar.png")
