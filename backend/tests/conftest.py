import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from types import SimpleNamespace
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


os.environ.setdefault("POSTGRES_HOST", "localhost")
os.environ.setdefault("POSTGRES_DB", "teamup_test")
os.environ.setdefault("POSTGRES_USER", "postgres")
os.environ.setdefault("POSTGRES_PASSWORD", "postgres")
os.environ.setdefault("REDIS_HOST", "localhost")
os.environ.setdefault("REDIS_PORT", "6379")
os.environ.setdefault("REDIS_PASSWORD", "redis")
os.environ.setdefault("ACCESS_SECRET_KEY", "test-access-secret")
os.environ.setdefault("REFRESH_SECRET_KEY", "test-refresh-secret")
os.environ.setdefault("ALGORITHM", "HS256")
os.environ.setdefault("SMTP_HOST", "localhost")
os.environ.setdefault("SMTP_PORT", "465")
os.environ.setdefault("SMTP_USER", "test@example.com")
os.environ.setdefault("SMTP_PASS", "secret")


@pytest.fixture
def user_id():
    return uuid4()


@pytest.fixture
def admin_user(user_id):
    from src.models.enums import UserType

    return SimpleNamespace(id=user_id, user_type=UserType.ADMIN)


@pytest.fixture
def regular_user(user_id):
    from src.models.enums import UserType

    return SimpleNamespace(id=user_id, user_type=UserType.USER)


@pytest.fixture
async def client():
    from main import app

    @asynccontextmanager
    async def test_lifespan(_app):
        yield

    app.router.lifespan_context = test_lifespan

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as ac:
        yield ac
        app.dependency_overrides.clear()
