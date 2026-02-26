from uuid import UUID

from fastapi import Depends
from src.core.dependencies import get_store
from src.core.exceptions import NotFoundException
from src.crud import Store
from src.schemas.user import (
    ContactInfo,
    Degree,
    Education,
    EducationCreate,
    EducationUpdate,
    ProfileCoreUpdate,
    UserProfileResponse,
    UserTypeEnum,
)
from src.utils.s3_service import S3Service


class UserService:
    """Сервис для управления пользователями системы.

    Предоставляет бизнес-логику для работы с пользователями: создание,
    обновление, проверка статуса и управление языковыми настройками.
    Интегрируется с DAO слоем для выполнения операций с базой данных.

    Используется в:
    - Эндпоинтах пользователей для CRUD операций
    - AuthenticationService для проверки пользователей
    - ReferralService для создания реферальных связей
    """

    def __init__(
        self,
        store: Store = Depends(get_store),
        s3: S3Service = Depends(),
    ):
        """Инициализация сервиса пользователей.

        Args:
            store: Хранилище данных, используемое для операций с пользователями.
        """
        self._store = store
        self._s3 = s3

    async def get_profile(self, user_id: UUID) -> UserProfileResponse:
        user = await self._store.user.find_by_id(model_id=user_id)
        if not user:
            raise NotFoundException

        avatar_url = None
        if user.avatar_key:
            avatar_url = await self._s3.presigned_get_url(key=user.avatar_key)

        educations = await self._store.user_education.find_all(user_id=user_id)
        education_list = [
            Education(
                id=edu.id,
                university=edu.university,
                specialty=edu.specialty,
                degree=Degree(edu.degree),
                graduation_year=edu.graduation_year,
            )
            for edu in educations
        ]

        return UserProfileResponse(
            id=user.id,
            user_type=UserTypeEnum(user.user_type.value),
            first_name=user.first_name,
            last_name=user.last_name,
            middle_name=user.middle_name,
            avatar_url=avatar_url,
            position=user.position,
            about=user.about,
            looking_for_projects=user.looking_for_projects,
            tags=user.tags,
            skills=user.skills,
            contact_info=ContactInfo(
                phone=user.phone,
                email=user.email,
                github_username=user.github_username,
                vk_username=user.vk_username,
                tg_username=user.tg_username,
                whatsapp_username=user.whatsapp_username,
            ),
            education=education_list,
            projects=[],  # TODO
        )

    async def update_profile(
        self, user_id: UUID, data: ProfileCoreUpdate | ContactInfo
    ) -> UserProfileResponse:
        await self._store.user.update(
            model_id=user_id, return_model=False, **data.model_dump(exclude_unset=True)
        )
        return await self.get_profile(user_id=user_id)

    async def update_skills(
        self, user_id: UUID, skills: list[str]
    ) -> UserProfileResponse:
        await self._store.user.update(
            model_id=user_id, return_model=False, skills=skills
        )
        return await self.get_profile(user_id=user_id)

    async def update_tags(self, user_id: UUID, tags: list[str]) -> UserProfileResponse:
        await self._store.user.update(model_id=user_id, return_model=False, tags=tags)
        return await self.get_profile(user_id=user_id)

    async def add_education(
        self, user_id: UUID, data: EducationCreate
    ) -> UserProfileResponse:
        """Добавляет новое образование для пользователя."""
        await self._store.user_education.add(
            user_id=user_id,
            university=data.university,
            specialty=data.specialty,
            degree=data.degree.value,
            graduation_year=data.graduation_year,
        )
        return await self.get_profile(user_id=user_id)

    async def update_education(
        self, user_id: UUID, edu_id: UUID, data: EducationUpdate
    ) -> UserProfileResponse:
        """Обновляет образование пользователя."""
        education = await self._store.user_education.find_one_or_none(
            id=edu_id, user_id=user_id
        )
        if not education:
            raise NotFoundException

        update_data = data.model_dump(exclude_unset=True)
        if "degree" in update_data and update_data["degree"] is not None:
            update_data["degree"] = update_data["degree"].value

        await self._store.user_education.update(
            model_id=edu_id, return_model=False, **update_data
        )
        return await self.get_profile(user_id=user_id)

    async def delete_education(
        self, user_id: UUID, edu_id: UUID
    ) -> UserProfileResponse:
        """Удаляет образование пользователя."""
        education = await self._store.user_education.find_one_or_none(
            id=edu_id, user_id=user_id
        )
        if not education:
            raise NotFoundException

        await self._store.user_education.delete(model_id=edu_id)
        return await self.get_profile(user_id=user_id)

    async def set_user_type(
        self, target_user_id: UUID, user_type: UserTypeEnum
    ) -> UserProfileResponse:
        """Назначает тип пользователя (user_type). Только для администратора (проверка на эндпоинте)."""
        from src.models.enums import UserType

        type_model = UserType(user_type.value)
        await self._store.user.update(
            model_id=target_user_id, return_model=False, user_type=type_model
        )
        return await self.get_profile(user_id=target_user_id)

    async def set_avatar_key(
        self, user_id: UUID, object_key: str
    ) -> UserProfileResponse:
        await self._store.user.update(
            model_id=user_id, return_model=False, avatar_key=object_key
        )
        return await self.get_profile(user_id=user_id)
