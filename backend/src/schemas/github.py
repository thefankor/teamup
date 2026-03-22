from datetime import datetime

from pydantic import BaseModel, HttpUrl


class GithubUserProfileResponse(BaseModel):
    login: str
    avatar_url: HttpUrl
    profile_url: HttpUrl
    public_repos: int
    followers: int
    following: int
    created_at: datetime
    api_url: HttpUrl


class GithubRepositoryResponse(BaseModel):
    name: str
    html_url: HttpUrl
    description: str | None = None
    stargazers_count: int
    watchers_count: int
    forks_count: int
    created_at: datetime
    updated_at: datetime


class GithubRepositoriesResponse(BaseModel):
    user_login: str
    items: list[GithubRepositoryResponse]
