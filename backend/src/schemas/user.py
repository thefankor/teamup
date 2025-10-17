from enum import Enum
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, HttpUrl, constr, field_validator


class SocialPlatform(str, Enum):
    telegram = "telegram"
    vk = "vk"
    github = "github"
    whatsapp = "whatsapp"
    other = "other"


class SocialLink(BaseModel):
    platform: SocialPlatform
    username: str = Field(..., min_length=2, max_length=64)
    url: Optional[HttpUrl] = None


class ContactInfo(BaseModel):
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    socials: List[SocialLink] = []


class Skill(BaseModel):
    name: constr(strip_whitespace=True, min_length=1, max_length=48)


class Degree(str, Enum):
    bachelor = "Бакалавриат"
    master = "Магистратура"
    specialist = "Специалитет"
    phd = "Аспирантура"


class Education(BaseModel):
    id: UUID
    university: str
    specialty: str
    degree: Degree
    graduation_year: int = Field(..., ge=1900, le=2100)


class Project(BaseModel):
    id: UUID
    title: str
    description: Optional[str] = None
    tags: List[str] = []


class UserProfileResponse(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    avatar_url: Optional[HttpUrl] = None
    position: Optional[str] = None
    about: Optional[str] = None
    looking_for_projects: bool = False
    tags: List[str]
    skills: List[Skill]
    contact_info: ContactInfo
    education: List[Education]
    projects: List[Project]


class ProfileCoreUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    position: Optional[str] = None
    about: Optional[str] = Field(None, max_length=5_000)
    looking_for_projects: Optional[bool] = None


class ContactsUpdate(ContactInfo):
    pass


class SkillsReplace(BaseModel):
    skills: List[Skill]

    @field_validator("skills")
    def unique_skills(cls, v):
        names = [s.name.lower() for s in v]
        if len(names) != len(set(names)):
            raise ValueError("Навыки должны быть уникальными")
        return v


class TagsReplace(BaseModel):
    tags: List[constr(strip_whitespace=True, min_length=1, max_length=32)]

    @field_validator("tags")
    def unique_tags(cls, v):
        low = [t.lower() for t in v]
        if len(low) != len(set(low)):
            raise ValueError("Теги должны быть уникальными")
        return v


class EducationCreate(BaseModel):
    university: str
    specialty: str
    degree: Degree
    graduation_year: int = Field(..., ge=1900, le=2100)


class EducationUpdate(BaseModel):
    university: Optional[str] = None
    specialty: Optional[str] = None
    degree: Optional[Degree] = None
    graduation_year: Optional[int] = Field(None, ge=1900, le=2100)
