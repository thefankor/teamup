import pytest
from fastapi import HTTPException, status
from src.services.github_service import GithubService


@pytest.mark.integration
@pytest.mark.asyncio
async def test_github_profile_endpoint_returns_service_payload(client):
    class StubGithubService:
        async def get_user_profile(self, username):
            assert username == "octocat"
            return {
                "login": "octocat",
                "avatar_url": "https://example.com/avatar.png",
                "profile_url": "https://github.com/octocat",
                "public_repos": 8,
                "followers": 10,
                "following": 3,
                "created_at": "2024-01-01T00:00:00Z",
                "api_url": "https://api.github.com/users/octocat",
            }

    from main import app

    app.dependency_overrides[GithubService] = lambda: StubGithubService()

    response = await client.get("/api/v1/github/users/octocat")

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["login"] == "octocat"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_github_top_repositories_endpoint_preserves_error_code(client):
    class StubGithubService:
        async def get_top_repositories(self, username, limit):
            raise HTTPException(
                status_code=429, detail="GitHub API rate limit exceeded"
            )

    from main import app

    app.dependency_overrides[GithubService] = lambda: StubGithubService()

    response = await client.get("/api/v1/github/users/octocat/top-repos")

    assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert response.json()["detail"] == "GitHub API rate limit exceeded"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_github_top_repositories_endpoint_validates_limit_range(client):
    response = await client.get("/api/v1/github/users/octocat/top-repos?limit=10")

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
