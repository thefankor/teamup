import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from types import SimpleNamespace
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient, MockTransport, Request, Response
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool
from src.config import settings
from src.core.dependencies import get_async_db, get_httpx_client
from src.crud import Store
from src.models import Base, User
from src.models import Session as UserSession
from src.models.enums import UserType
from src.schemas.auth import TokenInfo
from src.services.auth.auth_service import AuthService

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


os.environ.setdefault("POSTGRES_HOST", "127.0.0.1")
os.environ.setdefault("POSTGRES_DB", "teamup_test")
os.environ.setdefault("POSTGRES_PORT", "5432")
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


TEST_DATABASE_URL = settings.DATABASE_URL
test_engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)
TestSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


class InMemoryConfirmCodeService:
    def __init__(self):
        self.codes: dict[str, str] = {}

    async def save(self, email: str, code: int | str, ttl: int = 600) -> None:
        self.codes[email] = str(code)

    async def verify(self, email: str, submitted_code: str) -> bool:
        return self.codes.get(email) == submitted_code

    async def delete(self, email: str) -> None:
        self.codes.pop(email, None)


class InMemoryS3Service:
    def __init__(self):
        self.deleted_keys: list[str] = []

    async def ensure_bucket(self) -> None:
        return None

    async def generate_presigned_upload_url(
        self,
        *,
        user_id: str,
        content_type: str,
        expires_in: int = 600,
    ) -> tuple[str, str]:
        object_key = f"users/{user_id}/avatar/test-avatar.png"
        return f"https://storage.test/upload/{object_key}", object_key

    async def presigned_get_url(self, *, key: str, expires_in: int = 600) -> str:
        return f"https://storage.test/{key}"

    async def delete_object(self, *, key: str) -> None:
        self.deleted_keys.append(key)


class GitHubQueue:
    def __init__(self):
        self.responses: list[Response | Exception] = []

    def push_json(
        self,
        payload: dict | list,
        status_code: int = 200,
        headers: dict[str, str] | None = None,
    ):
        self.responses.append(
            Response(
                status_code=status_code,
                json=payload,
                headers=headers or {"Content-Type": "application/json"},
            )
        )

    def push_exception(self, exc: Exception):
        self.responses.append(exc)

    def handler(self, request: Request) -> Response:
        if not self.responses:
            raise AssertionError(f"No queued GitHub response for {request.url}")
        item = self.responses.pop(0)
        if isinstance(item, Exception):
            raise item
        return item


@pytest.fixture
def user_id():
    return uuid4()


@pytest.fixture
def admin_user(user_id):
    from src.models.enums import UserType

    return SimpleNamespace(id=user_id, user_type=UserType.ADMIN)


@pytest.fixture
def regular_user(user_id):
    return SimpleNamespace(id=user_id, user_type=UserType.USER)


@pytest.fixture
async def prepare_test_database():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


@pytest.fixture
async def reset_database(prepare_test_database):
    async with test_engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(
                text(f'TRUNCATE TABLE "{table.name}" RESTART IDENTITY CASCADE')
            )
    yield


@pytest.fixture
async def db_session(reset_database):
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def seeded_users(db_session: AsyncSession):
    admin = User(
        email="admin@example.com",
        user_type=UserType.ADMIN,
        first_name="Admin",
        last_name="User",
    )
    owner = User(
        email="owner@example.com",
        user_type=UserType.USER,
        first_name="Owner",
        last_name="User",
    )
    intruder = User(
        email="intruder@example.com",
        user_type=UserType.USER,
        first_name="Intruder",
        last_name="User",
    )
    db_session.add_all([admin, owner, intruder])
    await db_session.commit()
    for user in (admin, owner, intruder):
        await db_session.refresh(user)
    return SimpleNamespace(admin=admin, owner=owner, intruder=intruder)


@pytest.fixture
def auth_token_factory():
    async def _issue(user_id) -> TokenInfo:
        async with TestSessionLocal() as session:
            user_session = UserSession(user_id=user_id)
            session.add(user_session)
            await session.commit()
            await session.refresh(user_session)
        return AuthService.create_tokens(
            {
                "sub": str(user_id),
                "sid": str(user_session.id),
                "ver": user_session.version,
            }
        )

    return _issue


@pytest.fixture
def confirm_code_service():
    return InMemoryConfirmCodeService()


@pytest.fixture
def s3_service():
    return InMemoryS3Service()


@pytest.fixture
def github_queue():
    return GitHubQueue()


@pytest.fixture
async def client(
    prepare_test_database,
    reset_database,
    confirm_code_service,
    s3_service,
    github_queue,
):
    from main import app
    from src.utils.confirm_code_service import ConfirmCodeService
    from src.utils.s3_service import S3Service

    @asynccontextmanager
    async def test_lifespan(_app):
        yield

    app.router.lifespan_context = test_lifespan
    app.dependency_overrides[get_async_db] = None

    async def override_get_async_db():
        async with TestSessionLocal() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    async def override_get_httpx_client():
        async with AsyncClient(
            transport=MockTransport(github_queue.handler),
            base_url="https://api.github.com",
        ) as mocked_client:
            yield mocked_client

    app.dependency_overrides[get_async_db] = override_get_async_db
    app.dependency_overrides[ConfirmCodeService] = lambda: confirm_code_service
    app.dependency_overrides[S3Service] = lambda: s3_service
    app.dependency_overrides[get_httpx_client] = override_get_httpx_client

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as ac:
        yield ac
        app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def disable_email_task(monkeypatch):
    monkeypatch.setattr(
        "src.services.auth.auth_service.send_code_task.delay",
        lambda **kwargs: None,
    )


@pytest.fixture
async def store(db_session: AsyncSession):
    return Store(session=db_session)
