import asyncio
from collections.abc import Iterable

import httpx
from fastapi import Depends, HTTPException, status
from src.config import settings
from src.core.dependencies import get_httpx_client
from src.schemas.github import (
    GithubRepositoriesResponse,
    GithubRepositoryResponse,
    GithubUserProfileResponse,
)


class GithubService:
    MAX_RETRIES = 3

    def __init__(self, client: httpx.AsyncClient = Depends(get_httpx_client)):
        self._client = client
        self._base_url = settings.GITHUB_API_URL.rstrip("/")

    def _headers(self) -> dict[str, str]:
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if settings.GITHUB_TOKEN:
            headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"
        return headers

    async def _get(
        self, path: str, params: dict[str, str | int] | None = None
    ) -> dict | list:
        response = None

        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                response = await self._client.get(
                    f"{self._base_url}{path}",
                    params=params,
                    headers=self._headers(),
                )
            except httpx.TimeoutException as exc:
                if attempt == self.MAX_RETRIES:
                    raise HTTPException(
                        status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                        detail="GitHub API timeout",
                    ) from exc
                await asyncio.sleep(0.3 * attempt)
                continue
            except httpx.HTTPError as exc:
                if attempt == self.MAX_RETRIES:
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail="GitHub API is unavailable",
                    ) from exc
                await asyncio.sleep(0.3 * attempt)
                continue

            if (
                response.status_code
                in {
                    status.HTTP_429_TOO_MANY_REQUESTS,
                    status.HTTP_500_INTERNAL_SERVER_ERROR,
                    status.HTTP_502_BAD_GATEWAY,
                    status.HTTP_503_SERVICE_UNAVAILABLE,
                    status.HTTP_504_GATEWAY_TIMEOUT,
                }
                and attempt < self.MAX_RETRIES
            ):
                retry_after = response.headers.get("Retry-After")
                delay = (
                    float(retry_after)
                    if retry_after and retry_after.isdigit()
                    else 0.3 * attempt
                )
                await asyncio.sleep(delay)
                continue

            break

        if response is None:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="GitHub API is unavailable",
            )

        if response.status_code == status.HTTP_404_NOT_FOUND:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="GitHub user or repository not found",
            )

        if (
            response.status_code == status.HTTP_403_FORBIDDEN
            and response.headers.get("X-RateLimit-Remaining") == "0"
        ):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="GitHub API rate limit exceeded",
            )

        if response.status_code >= status.HTTP_400_BAD_REQUEST:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"GitHub API error: {response.text}",
            )

        return response.json()

    async def get_user_profile(self, username: str) -> GithubUserProfileResponse:
        data = await self._get(f"/users/{username}")
        return GithubUserProfileResponse(
            login=data["login"],
            avatar_url=data["avatar_url"],
            profile_url=data["html_url"],
            public_repos=data["public_repos"],
            followers=data["followers"],
            following=data["following"],
            created_at=data["created_at"],
            api_url=data["url"],
        )

    def _normalize_repositories(
        self, username: str, repositories: Iterable[dict]
    ) -> GithubRepositoriesResponse:
        items = [
            GithubRepositoryResponse(
                name=repo["name"],
                html_url=repo["html_url"],
                description=repo.get("description"),
                stargazers_count=repo["stargazers_count"],
                watchers_count=repo["watchers_count"],
                forks_count=repo["forks_count"],
                created_at=repo["created_at"],
                updated_at=repo["updated_at"],
            )
            for repo in repositories
        ]
        return GithubRepositoriesResponse(user_login=username, items=items)

    async def get_top_repositories(
        self,
        username: str,
        limit: int = 3,
    ) -> GithubRepositoriesResponse:
        repositories = await self._get(
            f"/users/{username}/repos",
            params={
                "sort": "updated",
                "direction": "desc",
                "per_page": limit,
                "type": "owner",
            },
        )
        return self._normalize_repositories(
            username=username, repositories=repositories
        )
