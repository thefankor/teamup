from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile
from src.core.dependencies import require_permission
from src.core.permissions import (
    PROFILE_READ_OWN,
    PROFILE_UPDATE_OWN,
    USERS_MANAGE_USER_TYPES,
)
from src.schemas.user import (
    ContactInfo,
    EducationCreate,
    EducationUpdate,
    ProfileCoreUpdate,
    SetUserTypeRequest,
    SkillsReplace,
    TagsReplace,
    UserProfileResponse,
)
from src.services.user import UserService
from starlette import status

router = APIRouter(tags=["User"])


def _current_user_id_profile():
    return Depends(require_permission(PROFILE_READ_OWN))


def _current_user_id_update():
    return Depends(require_permission(PROFILE_UPDATE_OWN))


@router.get(
    "",
    summary="Get profile",
    description="",
    response_model=UserProfileResponse,
    responses={
        401: {
            "description": "Токен не валиден",
            "content": {
                "application/json": {"example": {"detail": "Токен не валиден"}}
            },
        },
    },
)
async def get_profile(
    current_user_id: UUID = _current_user_id_profile(),
    service: UserService = Depends(),
):
    return await service.get_profile(user_id=current_user_id)


@router.get(
    "/{user_id}",
    summary="Get profile by id",
    description="",
    response_model=UserProfileResponse,
    responses={
        401: {
            "description": "Токен не валиден",
            "content": {
                "application/json": {"example": {"detail": "Токен не валиден"}}
            },
        },
        403: {
            "description": "Недостаточно прав",
            "content": {
                "application/json": {
                    "example": {"detail": "Недостаточно прав для выполнения действия"}
                }
            },
        },
    },
)
async def get_profile_by_id(
    user_id: UUID,
    _: UUID = Depends(require_permission(USERS_MANAGE_USER_TYPES)),
    service: UserService = Depends(),
):
    return await service.get_profile(user_id=user_id)


@router.patch("", response_model=UserProfileResponse)
async def update_core(
    payload: ProfileCoreUpdate,
    current_user_id: UUID = _current_user_id_update(),
    service: UserService = Depends(),
):
    return await service.update_profile(user_id=current_user_id, data=payload)


@router.put("/avatar", response_model=UserProfileResponse, status_code=200)  # TODO
async def put_avatar(
    file: UploadFile = File(...),
    current_user_id: UUID = _current_user_id_update(),
):
    pass


@router.patch("/contacts", response_model=UserProfileResponse)
async def put_contacts(
    payload: ContactInfo,
    current_user_id: UUID = _current_user_id_update(),
    service: UserService = Depends(),
):
    return await service.update_profile(user_id=current_user_id, data=payload)


@router.put("/skills", response_model=UserProfileResponse)
async def put_skills(
    payload: SkillsReplace,
    current_user_id: UUID = _current_user_id_update(),
    service: UserService = Depends(),
):
    return await service.update_skills(user_id=current_user_id, skills=payload.skills)


@router.put("/tags", response_model=UserProfileResponse)
async def put_tags(
    payload: TagsReplace,
    current_user_id: UUID = _current_user_id_update(),
    service: UserService = Depends(),
):
    return await service.update_tags(user_id=current_user_id, tags=payload.tags)


@router.post(
    "/education",
    response_model=UserProfileResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_education(
    payload: EducationCreate,
    current_user_id: UUID = _current_user_id_update(),
    service: UserService = Depends(),
):
    return await service.add_education(user_id=current_user_id, data=payload)


@router.patch("/education/{edu_id}", response_model=UserProfileResponse)
async def patch_education(
    edu_id: UUID,
    payload: EducationUpdate,
    current_user_id: UUID = _current_user_id_update(),
    service: UserService = Depends(),
):
    return await service.update_education(
        user_id=current_user_id, edu_id=edu_id, data=payload
    )


@router.delete(
    "/education/{edu_id}",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
)
async def delete_education(
    edu_id: UUID,
    current_user_id: UUID = _current_user_id_update(),
    service: UserService = Depends(),
):
    return await service.delete_education(user_id=current_user_id, edu_id=edu_id)


@router.put(
    "/{user_id}/user_type",
    response_model=UserProfileResponse,
    summary="Set user type (admin only)",
    responses={
        403: {
            "description": "Только для администратора",
            "content": {
                "application/json": {
                    "example": {"detail": "Недостаточно прав для выполнения действия"}
                }
            },
        }
    },
)
async def set_user_type(
    user_id: UUID,
    payload: SetUserTypeRequest,
    _: UUID = Depends(require_permission(USERS_MANAGE_USER_TYPES)),
    service: UserService = Depends(),
):
    return await service.set_user_type(
        target_user_id=user_id, user_type=payload.user_type
    )
