from uuid import uuid4

import pytest
from fastapi import status
from src.core import dependencies as deps
from src.models.enums import UserType
from src.services.user.user_service import UserService


@pytest.mark.integration
@pytest.mark.asyncio
async def test_get_profile_returns_structured_payload(client):
    user_id = uuid4()

    class StubUserService:
        async def get_profile(self, user_id):
            return {
                "id": str(user_id),
                "user_type": "USER",
                "first_name": "Sergey",
                "last_name": "Vozzin",
                "middle_name": None,
                "avatar_url": None,
                "position": "Backend developer",
                "about": "Builds APIs",
                "looking_for_projects": True,
                "tags": ["python"],
                "skills": ["fastapi"],
                "contact_info": {
                    "phone": None,
                    "email": "sergey@example.com",
                    "github_username": None,
                    "vk_username": None,
                    "tg_username": None,
                    "whatsapp_username": None,
                },
                "education": [],
                "projects": [],
            }

    from main import app

    app.dependency_overrides[deps.get_current_user_entity] = lambda: type(
        "User", (), {"id": user_id, "user_type": UserType.USER}
    )()
    app.dependency_overrides[UserService] = lambda: StubUserService()

    response = await client.get("/api/v1/user")

    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body["id"] == str(user_id)
    assert body["contact_info"]["email"] == "sergey@example.com"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_put_tags_rejects_duplicate_values_case_insensitively(client):
    user_id = uuid4()

    from main import app

    app.dependency_overrides[deps.get_current_user_entity] = lambda: type(
        "User", (), {"id": user_id, "user_type": UserType.USER}
    )()
    app.dependency_overrides[UserService] = lambda: UserService

    response = await client.put(
        "/api/v1/user/tags",
        json={"tags": ["Python", "python"]},
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.integration
@pytest.mark.asyncio
async def test_get_profile_by_id_forbidden_for_regular_user(client):
    target_user_id = uuid4()

    from main import app

    app.dependency_overrides[deps.get_current_user_entity] = lambda: type(
        "User", (), {"id": uuid4(), "user_type": UserType.USER}
    )()

    response = await client.get(f"/api/v1/user/{target_user_id}")

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.integration
@pytest.mark.asyncio
async def test_avatar_upload_url_endpoint_returns_expected_shape(client):
    user_id = uuid4()

    class StubUserService:
        async def generate_presigned_upload_url(self, user_id, content_type):
            assert content_type == "image/png"
            return {
                "upload_url": "https://s3.example/upload",
                "object_key": f"users/{user_id}/avatar/file.png",
            }

    from main import app

    app.dependency_overrides[deps.get_current_user_entity] = lambda: type(
        "User", (), {"id": user_id, "user_type": UserType.USER}
    )()
    app.dependency_overrides[UserService] = lambda: StubUserService()

    response = await client.post(
        "/api/v1/user/avatar/upload-url",
        params={"content_type": "image/png"},
    )

    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body["upload_url"] == "https://s3.example/upload"
    assert body["object_key"].endswith("/avatar/file.png")
