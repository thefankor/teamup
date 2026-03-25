import pytest
from fastapi import status


@pytest.mark.integration
@pytest.mark.asyncio
async def test_github_profile_endpoint_returns_service_payload(client, github_queue):
    github_queue.push_json(
        {
            "login": "octocat",
            "avatar_url": "https://example.com/avatar.png",
            "html_url": "https://github.com/octocat",
            "public_repos": 8,
            "followers": 10,
            "following": 3,
            "created_at": "2024-01-01T00:00:00Z",
            "url": "https://api.github.com/users/octocat",
        }
    )

    response = await client.get("/api/v1/github/users/octocat")

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["login"] == "octocat"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_github_top_repositories_endpoint_preserves_error_code(
    client, github_queue
):
    github_queue.push_json(
        {"message": "rate limit"},
        status_code=403,
        headers={"X-RateLimit-Remaining": "0"},
    )

    response = await client.get("/api/v1/github/users/octocat/top-repos")

    assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS


@pytest.mark.integration
@pytest.mark.asyncio
async def test_github_top_repositories_endpoint_validates_limit_range(client):
    response = await client.get("/api/v1/github/users/octocat/top-repos?limit=10")

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
