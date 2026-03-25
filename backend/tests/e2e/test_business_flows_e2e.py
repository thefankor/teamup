from datetime import datetime, timedelta, timezone

import httpx
import pytest
from src.models import Project, ProjectPosition
from src.schemas.project import ProjectStatus


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_login_logout_and_session_recovery_flow(
    client,
    db_session,
    confirm_code_service,
):
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "new-user@example.com"},
    )
    assert login_response.status_code == 200
    assert "new-user@example.com" in confirm_code_service.codes

    verify_response = await client.post(
        "/api/v1/auth/verify",
        json={
            "email": "new-user@example.com",
            "code": confirm_code_service.codes["new-user@example.com"],
        },
    )
    assert verify_response.status_code == 200
    tokens = verify_response.json()

    profile_response = await client.get(
        "/api/v1/user",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert profile_response.status_code == 200
    assert profile_response.json()["contact_info"]["email"] == "new-user@example.com"

    refresh_response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert refresh_response.status_code == 200
    refreshed = refresh_response.json()
    assert refreshed["access_token"] != tokens["access_token"]

    logout_response = await client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {refreshed['access_token']}"},
    )
    assert logout_response.status_code == 200

    after_logout = await client.get(
        "/api/v1/user",
        headers={"Authorization": f"Bearer {refreshed['access_token']}"},
    )
    assert after_logout.status_code == 401


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_crud_and_role_boundaries(client, seeded_users, auth_token_factory):
    owner_tokens = await auth_token_factory(seeded_users.owner.id)
    intruder_tokens = await auth_token_factory(seeded_users.intruder.id)
    admin_tokens = await auth_token_factory(seeded_users.admin.id)

    create_response = await client.post(
        "/api/v1/projects",
        headers={"Authorization": f"Bearer {owner_tokens.access_token}"},
        json={
            "title": "Platform",
            "description": "Team collaboration platform",
            "tags": ["python", "team"],
            "positions": [{"role": "Back-end", "level": "middle", "tags": ["fastapi"]}],
        },
    )
    assert create_response.status_code == 201
    project_id = create_response.json()["id"]

    forbidden_update = await client.patch(
        f"/api/v1/projects/{project_id}",
        headers={"Authorization": f"Bearer {intruder_tokens.access_token}"},
        json={"title": "Hijacked"},
    )
    assert forbidden_update.status_code == 403

    owner_update = await client.patch(
        f"/api/v1/projects/{project_id}",
        headers={"Authorization": f"Bearer {owner_tokens.access_token}"},
        json={"title": "Platform v2", "status": ProjectStatus.closed.value},
    )
    assert owner_update.status_code == 200
    assert owner_update.json()["title"] == "Platform v2"
    assert owner_update.json()["status"] == "closed"

    regular_profile_access = await client.get(
        f"/api/v1/user/{seeded_users.admin.id}",
        headers={"Authorization": f"Bearer {owner_tokens.access_token}"},
    )
    assert regular_profile_access.status_code == 403

    promote_user = await client.put(
        f"/api/v1/user/{seeded_users.intruder.id}/user_type",
        headers={"Authorization": f"Bearer {admin_tokens.access_token}"},
        json={"user_type": "ADMIN"},
    )
    assert promote_user.status_code == 200
    assert promote_user.json()["user_type"] == "ADMIN"

    delete_response = await client.delete(
        f"/api/v1/projects/{project_id}",
        headers={"Authorization": f"Bearer {owner_tokens.access_token}"},
    )
    assert delete_response.status_code == 204

    missing_project = await client.get(f"/api/v1/projects/{project_id}")
    assert missing_project.status_code == 404


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_filter_sort_and_pagination_scenarios(client, db_session, seeded_users):
    first = Project(
        title="Alpha backend",
        description="API work",
        tags=["python"],
        is_open=True,
        owner_id=seeded_users.owner.id,
    )
    second = Project(
        title="Beta frontend",
        description="UI work",
        tags=["react"],
        is_open=True,
        owner_id=seeded_users.owner.id,
    )
    third = Project(
        title="Gamma backend",
        description="ML backend",
        tags=["ml"],
        is_open=True,
        owner_id=seeded_users.owner.id,
    )
    db_session.add_all([first, second, third])
    await db_session.commit()
    for project in (first, second, third):
        await db_session.refresh(project)

    first.created_at = datetime.now(timezone.utc) - timedelta(days=2)
    second.created_at = datetime.now(timezone.utc) - timedelta(days=1)
    third.created_at = datetime.now(timezone.utc)
    await db_session.commit()

    db_session.add_all(
        [
            ProjectPosition(
                project_id=first.id, name="Back-end", role="Back-end", level="middle"
            ),
            ProjectPosition(
                project_id=second.id, name="Front-end", role="Front-end", level="junior"
            ),
            ProjectPosition(
                project_id=third.id, name="Back-end", role="Back-end", level="middle"
            ),
            ProjectPosition(
                project_id=third.id,
                name="ML-developer",
                role="ML-developer",
                level="senior",
            ),
        ]
    )
    await db_session.commit()

    filtered = await client.get(
        "/api/v1/projects",
        params={
            "q": "backend",
            "role": "Back-end",
            "level": "middle",
            "sort_by": "created_at",
            "order": "asc",
            "limit": 1,
            "offset": 0,
        },
    )
    assert filtered.status_code == 200
    body = filtered.json()
    assert body["total"] == 2
    assert [item["title"] for item in body["items"]] == ["Alpha backend"]

    next_page = await client.get(
        "/api/v1/projects",
        params={
            "role": "Back-end",
            "level": "middle",
            "sort_by": "created_at",
            "order": "asc",
            "limit": 1,
            "offset": 1,
        },
    )
    assert next_page.status_code == 200
    assert [item["title"] for item in next_page.json()["items"]] == ["Gamma backend"]

    sorted_by_positions = await client.get(
        "/api/v1/projects",
        params={"sort_by": "open_positions", "order": "desc", "limit": 3, "offset": 0},
    )
    assert sorted_by_positions.status_code == 200
    assert sorted_by_positions.json()["items"][0]["title"] == "Gamma backend"


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_avatar_upload_and_retrieval_flow(
    client, seeded_users, auth_token_factory, s3_service
):
    tokens = await auth_token_factory(seeded_users.owner.id)

    upload_response = await client.post(
        "/api/v1/user/avatar/upload-url",
        params={"content_type": "image/png"},
        headers={"Authorization": f"Bearer {tokens.access_token}"},
    )
    assert upload_response.status_code == 200
    upload_payload = upload_response.json()

    confirm_response = await client.put(
        "/api/v1/user/avatar/confirm",
        params={"object_key": upload_payload["object_key"]},
        headers={"Authorization": f"Bearer {tokens.access_token}"},
    )
    assert confirm_response.status_code == 200
    assert (
        confirm_response.json()["avatar_url"]
        == f"https://storage.test/{upload_payload['object_key']}"
    )

    profile_response = await client.get(
        "/api/v1/user",
        headers={"Authorization": f"Bearer {tokens.access_token}"},
    )
    assert profile_response.status_code == 200
    assert (
        profile_response.json()["avatar_url"]
        == f"https://storage.test/{upload_payload['object_key']}"
    )

    delete_response = await client.delete(
        "/api/v1/user/avatar",
        headers={"Authorization": f"Bearer {tokens.access_token}"},
    )
    assert delete_response.status_code == 204

    after_delete = await client.get(
        "/api/v1/user",
        headers={"Authorization": f"Bearer {tokens.access_token}"},
    )
    assert after_delete.status_code == 200
    assert after_delete.json()["avatar_url"] is None
    assert upload_payload["object_key"] in s3_service.deleted_keys


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_github_api_success_and_failure_scenarios(client, github_queue):
    github_queue.push_json(
        {
            "login": "octocat",
            "avatar_url": "https://example.com/avatar.png",
            "html_url": "https://github.com/octocat",
            "public_repos": 8,
            "followers": 100,
            "following": 5,
            "created_at": "2024-01-01T00:00:00Z",
            "url": "https://api.github.com/users/octocat",
        }
    )
    github_queue.push_json(
        [
            {
                "name": "teamup",
                "html_url": "https://github.com/octocat/teamup",
                "description": "Main repo",
                "stargazers_count": 10,
                "watchers_count": 10,
                "forks_count": 2,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-02T00:00:00Z",
            },
            {
                "name": "docs",
                "html_url": "https://github.com/octocat/docs",
                "description": "Docs repo",
                "stargazers_count": 5,
                "watchers_count": 5,
                "forks_count": 1,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-02T00:00:00Z",
            },
        ]
    )

    profile = await client.get("/api/v1/github/users/octocat")
    assert profile.status_code == 200
    assert profile.json()["login"] == "octocat"

    repos = await client.get(
        "/api/v1/github/users/octocat/top-repos", params={"limit": 2}
    )
    assert repos.status_code == 200
    assert len(repos.json()["items"]) == 2

    github_queue.push_exception(httpx.TimeoutException("timeout"))
    github_queue.push_exception(httpx.TimeoutException("timeout"))
    github_queue.push_exception(httpx.TimeoutException("timeout"))

    timeout_response = await client.get("/api/v1/github/users/slowpoke")
    assert timeout_response.status_code == 504
    assert timeout_response.json()["detail"] == "GitHub API timeout"
