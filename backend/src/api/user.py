from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile
from src.core.dependencies import get_current_user_id
from src.schemas.user import (
    ContactInfo,
    EducationCreate,
    EducationUpdate,
    ProfileCoreUpdate,
    SkillsReplace,
    TagsReplace,
    UserProfileResponse,
)
from src.services.user import UserService
from starlette import status

router = APIRouter(tags=["User"])


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
    current_user_id: UUID = Depends(get_current_user_id),
    service: UserService = Depends(),
):
    return await service.get_profile(user_id=current_user_id)


@router.patch("", response_model=UserProfileResponse)
async def update_core(
    payload: ProfileCoreUpdate,
    current_user_id=Depends(get_current_user_id),
    service: UserService = Depends(),
):
    return await service.update_profile(user_id=current_user_id, data=payload)


@router.put("/avatar", response_model=UserProfileResponse, status_code=200)  # TODO
async def put_avatar(file: UploadFile = File(...), user=Depends(get_current_user_id)):
    pass


@router.patch("/contacts", response_model=UserProfileResponse)
async def put_contacts(
    payload: ContactInfo,
    current_user_id=Depends(get_current_user_id),
    service: UserService = Depends(),
):
    return await service.update_profile(user_id=current_user_id, data=payload)


@router.put("/skills", response_model=UserProfileResponse)
async def put_skills(
    payload: SkillsReplace,
    current_user_id=Depends(get_current_user_id),
    service: UserService = Depends(),
):
    return await service.update_skills(user_id=current_user_id, skills=payload.skills)


@router.put("/tags", response_model=UserProfileResponse)
async def put_tags(
    payload: TagsReplace,
    current_user_id=Depends(get_current_user_id),
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
    current_user_id: UUID = Depends(get_current_user_id),
    service: UserService = Depends(),
):
    return await service.add_education(user_id=current_user_id, data=payload)


@router.patch("/education/{edu_id}", response_model=UserProfileResponse)
async def patch_education(
    edu_id: UUID,
    payload: EducationUpdate,
    current_user_id: UUID = Depends(get_current_user_id),
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
    current_user_id: UUID = Depends(get_current_user_id),
    service: UserService = Depends(),
):
    return await service.delete_education(user_id=current_user_id, edu_id=edu_id)
