from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from src.core.exceptions import ForbiddenException, NotFoundException
from src.models.enums import ApplicationStatus as ModelApplicationStatus
from src.models.enums import UserType
from src.schemas.project import (
    ApplicationCreate,
    ApplicationDecision,
    Level,
    ProjectCreate,
    ProjectPositionCreate,
    ProjectUpdate,
)
from src.services.project.project_service import ProjectService


def build_project(*, owner_id, project_id=None, is_open=True):
    now = datetime.now(timezone.utc)
    return SimpleNamespace(
        id=project_id or uuid4(),
        owner_id=owner_id,
        title="AI Platform",
        description="Build a platform",
        tags=["python", "ml"],
        is_open=is_open,
        created_at=now,
        updated_at=now,
    )


@pytest.mark.unit
@pytest.mark.asyncio
async def test_create_project_creates_project_and_positions(monkeypatch):
    owner_id = uuid4()
    project = build_project(owner_id=owner_id)
    store = SimpleNamespace(
        project=SimpleNamespace(add=AsyncMock(return_value=project)),
        project_position=SimpleNamespace(
            add=AsyncMock(), find_all=AsyncMock(return_value=[])
        ),
        project_participant=SimpleNamespace(find_all=AsyncMock(return_value=[])),
        project_application=SimpleNamespace(find_all=AsyncMock(return_value=[])),
        user=SimpleNamespace(
            find_by_id=AsyncMock(
                return_value=SimpleNamespace(
                    id=owner_id,
                    user_type=UserType.USER,
                    first_name="Ivan",
                    last_name="Petrov",
                    tags=[],
                    avatar_key=None,
                )
            )
        ),
    )
    service = ProjectService(
        store=store, s3=SimpleNamespace(presigned_get_url=AsyncMock())
    )

    payload = ProjectCreate(
        title="AI Platform",
        description="Build a platform",
        tags=["python", "ml"],
        positions=[
            ProjectPositionCreate(role="Backend", level=Level.middle, tags=["fastapi"]),
            ProjectPositionCreate(role="Frontend", level=Level.junior, tags=["react"]),
        ],
    )

    result = await service.create_project(user_id=owner_id, data=payload)

    store.project.add.assert_awaited_once()
    assert store.project_position.add.await_count == 2
    assert result.title == "AI Platform"
    assert result.status.value == "open"
    assert result.team[0].is_owner is True


@pytest.mark.unit
@pytest.mark.asyncio
async def test_update_project_forbidden_for_non_owner():
    owner_id = uuid4()
    intruder_id = uuid4()
    project = build_project(owner_id=owner_id)
    store = SimpleNamespace(
        project=SimpleNamespace(
            find_by_id=AsyncMock(return_value=project), update=AsyncMock()
        ),
    )
    service = ProjectService(store=store, s3=SimpleNamespace())

    with pytest.raises(ForbiddenException):
        await service.update_project(
            project_id=project.id,
            user_id=intruder_id,
            data=ProjectUpdate(title="New title"),
        )

    store.project.update.assert_not_called()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_submit_application_raises_when_every_position_is_duplicate():
    project_id = uuid4()
    user_id = uuid4()
    position_id = uuid4()
    existing_application = SimpleNamespace(id=uuid4())
    store = SimpleNamespace(
        project_position=SimpleNamespace(
            find_one_or_none=AsyncMock(return_value=SimpleNamespace(id=position_id))
        ),
        project_application=SimpleNamespace(
            find_one_or_none=AsyncMock(return_value=existing_application),
            add=AsyncMock(),
        ),
    )
    service = ProjectService(store=store, s3=SimpleNamespace())

    with pytest.raises(NotFoundException):
        await service.submit_application(
            project_id=project_id,
            user_id=user_id,
            data=ApplicationCreate(position_ids=[position_id], message="Let me join"),
        )

    store.project_application.add.assert_not_called()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_decide_application_approve_adds_participant():
    owner_id = uuid4()
    applicant_id = uuid4()
    project_id = uuid4()
    application_id = uuid4()
    position_id = uuid4()
    project = build_project(owner_id=owner_id, project_id=project_id)
    application = SimpleNamespace(
        id=application_id,
        user_id=applicant_id,
        position_id=position_id,
        message="Ready to help",
        status=ModelApplicationStatus.PENDING,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    approved_payload = dict(application.__dict__)
    approved_payload["status"] = ModelApplicationStatus.APPROVED
    approved_application = SimpleNamespace(**approved_payload)
    store = SimpleNamespace(
        project=SimpleNamespace(find_by_id=AsyncMock(return_value=project)),
        project_application=SimpleNamespace(
            find_one_or_none=AsyncMock(return_value=application),
            update=AsyncMock(),
            find_by_id=AsyncMock(return_value=approved_application),
        ),
        project_participant=SimpleNamespace(
            find_one_or_none=AsyncMock(return_value=None),
            add=AsyncMock(),
        ),
        project_position=SimpleNamespace(
            find_by_id=AsyncMock(return_value=SimpleNamespace(role="Backend"))
        ),
    )
    service = ProjectService(store=store, s3=SimpleNamespace())

    result = await service.decide_application(
        project_id=project_id,
        application_id=application_id,
        user_id=owner_id,
        data=ApplicationDecision(approve=True, note="Welcome"),
    )

    store.project_participant.add.assert_awaited_once_with(
        project_id=project_id,
        user_id=applicant_id,
        role="Backend",
    )
    assert result.status.value == "approved"
    assert result.decided_by == owner_id


@pytest.mark.unit
@pytest.mark.asyncio
async def test_list_applications_forbidden_for_non_owner():
    owner_id = uuid4()
    intruder_id = uuid4()
    project = build_project(owner_id=owner_id)
    store = SimpleNamespace(
        project=SimpleNamespace(find_by_id=AsyncMock(return_value=project)),
    )
    service = ProjectService(store=store, s3=SimpleNamespace())

    with pytest.raises(ForbiddenException):
        await service.list_applications(
            project_id=project.id,
            user_id=intruder_id,
        )


@pytest.mark.unit
@pytest.mark.asyncio
async def test_decide_application_reject_does_not_add_participant():
    owner_id = uuid4()
    applicant_id = uuid4()
    project_id = uuid4()
    application_id = uuid4()
    position_id = uuid4()
    project = build_project(owner_id=owner_id, project_id=project_id)
    application = SimpleNamespace(
        id=application_id,
        user_id=applicant_id,
        position_id=position_id,
        message="Ready to help",
        status=ModelApplicationStatus.PENDING,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    rejected_payload = dict(application.__dict__)
    rejected_payload["status"] = ModelApplicationStatus.REJECTED
    rejected_application = SimpleNamespace(**rejected_payload)
    store = SimpleNamespace(
        project=SimpleNamespace(find_by_id=AsyncMock(return_value=project)),
        project_application=SimpleNamespace(
            find_one_or_none=AsyncMock(return_value=application),
            update=AsyncMock(),
            find_by_id=AsyncMock(return_value=rejected_application),
        ),
        project_participant=SimpleNamespace(
            find_one_or_none=AsyncMock(),
            add=AsyncMock(),
        ),
        project_position=SimpleNamespace(find_by_id=AsyncMock()),
    )
    service = ProjectService(store=store, s3=SimpleNamespace())

    result = await service.decide_application(
        project_id=project_id,
        application_id=application_id,
        user_id=owner_id,
        data=ApplicationDecision(approve=False, note="Not a fit"),
    )

    store.project_participant.find_one_or_none.assert_not_called()
    store.project_participant.add.assert_not_called()
    assert result.status.value == "rejected"
