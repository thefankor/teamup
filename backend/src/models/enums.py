import enum


class ApplicationStatus(enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class UserType(str, enum.Enum):
    """Тип пользователя для RBAC (user_type). guest — отсутствие авторизации, в БД не хранится."""

    USER = "USER"
    ADMIN = "ADMIN"
