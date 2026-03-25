from uuid import uuid4

import pytest
from fastapi import status
from src.models import ProjectPosition


@pytest.mark.integration
@pytest.mark.asyncio
async def test_create_project_returns_201_and_project_payload(
    client, seeded_users, auth_token_factory
):
    owner_tokens = await auth_token_factory(seeded_users.owner.id)

    response = await client.post(
        "/api/v1/projects",
        headers={"Authorization": f"Bearer {owner_tokens.access_token}"},
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
    assert len(body["positions"]) == 1


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
async def test_submit_application_returns_created_payload(
    client, seeded_users, auth_token_factory, db_session
):
    owner_tokens = await auth_token_factory(seeded_users.owner.id)
    applicant_tokens = await auth_token_factory(seeded_users.intruder.id)

    create_project = await client.post(
        "/api/v1/projects",
        headers={"Authorization": f"Bearer {owner_tokens.access_token}"},
        json={
            "title": "TeamUp API",
            "description": "Backend service",
            "tags": ["fastapi"],
            "positions": [{"role": "Backend", "level": "middle", "tags": ["python"]}],
        },
    )
    project_id = create_project.json()["id"]

    position = (
        await db_session.execute(
            ProjectPosition.__table__.select().where(
                ProjectPosition.project_id == project_id
            )
        )
    ).first()
    position_id = position.id

    response = await client.post(
        f"/api/v1/projects/{project_id}/applications",
        headers={"Authorization": f"Bearer {applicant_tokens.access_token}"},
        json={"position_ids": [str(position_id)], "message": "Can I join?"},
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["status"] == "pending"
