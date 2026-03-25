import httpx
import pytest
from fastapi import HTTPException
from src.services.github_service import GithubService


class FakeResponse:
    def __init__(self, status_code, payload, headers=None, text=""):
        self.status_code = status_code
        self._payload = payload
        self.headers = headers or {}
        self.text = text

    def json(self):
        return self._payload


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_user_profile_retries_after_timeout(monkeypatch):
    calls = {"count": 0}

    async def fake_get(*args, **kwargs):
        calls["count"] += 1
        if calls["count"] == 1:
            raise httpx.TimeoutException("timeout")
        return FakeResponse(
            200,
            {
                "login": "octocat",
                "avatar_url": "https://example.com/avatar.png",
                "html_url": "https://github.com/octocat",
                "public_repos": 8,
                "followers": 10,
                "following": 3,
                "created_at": "2024-01-01T00:00:00Z",
                "url": "https://api.github.com/users/octocat",
            },
        )

    async def no_sleep(*args, **kwargs):
        return None

    client = type("Client", (), {"get": fake_get})()
    service = GithubService(client=client)
    monkeypatch.setattr("src.services.github_service.asyncio.sleep", no_sleep)

    result = await service.get_user_profile("octocat")

    assert calls["count"] == 2
    assert result.login == "octocat"
    assert str(result.profile_url) == "https://github.com/octocat"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_returns_404_for_missing_user():
    async def fake_get(*args, **kwargs):
        return FakeResponse(404, {"message": "Not Found"})

    client = type("Client", (), {"get": fake_get})()
    service = GithubService(client=client)

    with pytest.raises(HTTPException) as exc:
        await service.get_user_profile("missing-user")

    assert exc.value.status_code == 404
    assert exc.value.detail == "GitHub user or repository not found"
