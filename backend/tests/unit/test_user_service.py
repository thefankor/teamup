from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from fastapi import HTTPException
from src.core.exceptions import NotFoundException
from src.schemas.user import EducationUpdate
from src.services.user.user_service import UserService


@pytest.mark.unit
@pytest.mark.asyncio
async def test_update_education_raises_for_missing_record():
    store = SimpleNamespace(
        user_education=SimpleNamespace(
            find_one_or_none=AsyncMock(return_value=None),
            update=AsyncMock(),
        )
    )
    service = UserService(store=store, s3=SimpleNamespace())

    with pytest.raises(NotFoundException):
        await service.update_education(
            user_id=uuid4(),
            edu_id=uuid4(),
            data=EducationUpdate(university="ITMO"),
        )

    store.user_education.update.assert_not_called()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_set_avatar_key_returns_502_when_old_file_delete_fails(monkeypatch):
    user_id = uuid4()
    store = SimpleNamespace(
        user=SimpleNamespace(
            get_avatar_key_by_id=AsyncMock(return_value="users/1/avatar/old.png"),
            update=AsyncMock(),
        )
    )
    s3 = SimpleNamespace(delete_object=AsyncMock(side_effect=RuntimeError("boom")))
    service = UserService(store=store, s3=s3)

    with pytest.raises(HTTPException) as exc:
        await service.set_avatar_key(
            user_id=user_id, object_key="users/1/avatar/new.png"
        )

    assert exc.value.status_code == 502
    assert exc.value.detail == "Не удалось удалить файл из S3"
    store.user.update.assert_not_called()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_delete_avatar_returns_without_s3_call_when_avatar_missing():
    user_id = uuid4()
    store = SimpleNamespace(
        user=SimpleNamespace(
            find_by_id=AsyncMock(return_value=SimpleNamespace(avatar_key=None)),
            update=AsyncMock(),
        )
    )
    s3 = SimpleNamespace(delete_object=AsyncMock())
    service = UserService(store=store, s3=s3)

    result = await service.delete_avatar(user_id=user_id)

    assert result is None
    s3.delete_object.assert_not_called()
    store.user.update.assert_not_called()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_generate_presigned_upload_url_returns_both_fields():
    s3 = SimpleNamespace(
        generate_presigned_upload_url=AsyncMock(
            return_value=("https://s3.example/upload", "users/1/avatar/file.png")
        )
    )
    service = UserService(store=SimpleNamespace(), s3=s3)

    result = await service.generate_presigned_upload_url(
        user_id=uuid4(),
        content_type="image/png",
    )

    assert result.upload_url == "https://s3.example/upload"
    assert result.object_key == "users/1/avatar/file.png"
