from uuid import uuid4

import pytest
from fastapi import status
from src.core import dependencies as deps
from src.models.enums import UserType
from src.schemas.project import ProjectStatus
from src.services.project.project_service import ProjectService


@pytest.mark.integration
@pytest.mark.asyncio
async def test_create_project_returns_201_and_project_payload(client):
    owner_id = uuid4()

    class StubProjectService:
        async def create_project(self, user_id, data):
            assert user_id == owner_id
            return {
                "id": str(uuid4()),
                "owner_id": str(owner_id),
                "title": data.title,
                "description": data.description,
                "tags": data.tags,
                "status": ProjectStatus.open,
                "created_at": "2026-03-22T10:00:00Z",
                "updated_at": "2026-03-22T10:00:00Z",
                "team": [],
                "positions": [],
            }

    from main import app

    app.dependency_overrides[deps.get_current_user_entity] = lambda: type(
        "User", (), {"id": owner_id, "user_type": UserType.USER}
    )()
    app.dependency_overrides[ProjectService] = lambda: StubProjectService()

    response = await client.post(
        "/api/v1/projects",
        json={
            "title": "TeamUp API",
            "description": "Backend service",
            "tags": ["fastapi"],
            "positions": [{"role": "Backend", "level": "middle", "tags": ["python"]}],
        },
    )

    assert response.status_code == status.HTTP_201_CREATED
    body = response.json()
    assert body["title"] == "TeamUp API"
    assert body["status"] == "open"
    assert body["positions"] == []


@pytest.mark.integration
@pytest.mark.asyncio
async def test_update_project_requires_authentication(client):
    response = await client.patch(
        f"/api/v1/projects/{uuid4()}",
        json={"title": "Updated"},
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.integration
@pytest.mark.asyncio
async def test_get_project_validates_uuid(client):
    response = await client.get("/api/v1/projects/not-a-uuid")

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.integration
@pytest.mark.asyncio
async def test_submit_application_returns_created_payload(client):
    current_user_id = uuid4()
    project_id = uuid4()
    application_id = uuid4()
    position_id = uuid4()

    class StubProjectService:
        async def submit_application(self, project_id, user_id, data):
            assert user_id == current_user_id
            assert data.position_ids == [position_id]
            return {
                "id": str(application_id),
                "project_id": str(project_id),
                "applicant_id": str(user_id),
                "position_ids": [str(position_id)],
                "message": data.message,
                "status": "pending",
                "created_at": "2026-03-22T10:00:00Z",
                "decided_at": None,
                "decided_by": None,
            }

    from main import app

    app.dependency_overrides[deps.get_current_user_entity] = lambda: type(
        "User", (), {"id": current_user_id, "user_type": UserType.USER}
    )()
    app.dependency_overrides[ProjectService] = lambda: StubProjectService()

    response = await client.post(
        f"/api/v1/projects/{project_id}/applications",
        json={"position_ids": [str(position_id)], "message": "Can I join?"},
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["status"] == "pending"
