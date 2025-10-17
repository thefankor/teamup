from uuid import UUID

from fastapi import APIRouter, Depends, UploadFile, File
from starlette import status

from src.core.dependencies import get_current_user
from src.models import User
from src.schemas.user import UserProfileResponse, ProfileCoreUpdate, ContactsUpdate, SkillsReplace, TagsReplace, \
    EducationCreate, EducationUpdate

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
    current_user: User = Depends(get_current_user),
):
    return None


@router.patch("", response_model=UserProfileResponse)
async def update_core(payload: ProfileCoreUpdate, user = Depends(get_current_user)):
    pass


@router.put("/avatar", response_model=UserProfileResponse, status_code=200)
async def put_avatar(file: UploadFile = File(...), user = Depends(get_current_user)):
    pass


@router.put("/contacts", response_model=UserProfileResponse)
async def put_contacts(payload: ContactsUpdate, user = Depends(get_current_user)):
    pass


@router.put("/skills", response_model=UserProfileResponse)
async def put_skills(payload: SkillsReplace, user = Depends(get_current_user)):
    pass


@router.put("/tags", response_model=UserProfileResponse)
async def put_tags(payload: TagsReplace, user = Depends(get_current_user)):
    pass


@router.post("/education", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED)
async def add_education(payload: EducationCreate, user = Depends(get_current_user)):
    pass


@router.patch("/education/{edu_id}", response_model=UserProfileResponse)
async def patch_education(edu_id: UUID, payload: EducationUpdate, user = Depends(get_current_user)):
    pass


@router.delete("/education/{edu_id}", response_model=UserProfileResponse, status_code=status.HTTP_200_OK)
async def delete_education(edu_id: UUID, user_id = Depends(get_current_user)):
    pass
