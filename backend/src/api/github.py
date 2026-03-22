from fastapi import APIRouter, Depends, Query
from src.schemas.github import GithubRepositoriesResponse, GithubUserProfileResponse
from src.services.github_service import GithubService

router = APIRouter(tags=["GitHub"])


@router.get(
    "/users/{username}",
    response_model=GithubUserProfileResponse,
    summary="Get GitHub user profile",
)
async def get_github_user(
    username: str,
    service: GithubService = Depends(),
):
    return await service.get_user_profile(username=username)


@router.get(
    "/users/{username}/top-repos",
    response_model=GithubRepositoriesResponse,
    summary="Get GitHub top repositories",
)
async def get_github_top_repositories(
    username: str,
    limit: int = Query(default=3, ge=1, le=3),
    service: GithubService = Depends(),
):
    return await service.get_top_repositories(username=username, limit=limit)
