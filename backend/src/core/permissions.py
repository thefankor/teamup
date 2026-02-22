"""
RBAC: матрица типов пользователя и разрешений (user_type → allowed actions).
Проверка прав на уровне эндпоинтов через dependency require_permission(perm).
"""

from src.models.enums import UserType

AUTH_LOGIN = "auth:login"
PROJECTS_LIST_OPEN = "projects:list_open"
PROJECTS_VIEW = "projects:view"
PROFILE_READ_OWN = "profile:read_own"
PROFILE_UPDATE_OWN = "profile:update_own"
PROJECTS_CREATE = "projects:create"
PROJECTS_LIST_OWN = "projects:list_own"
PROJECTS_LIST_PARTICIPATING = "projects:list_participating"
PROJECTS_UPDATE_OWN = "projects:update_own"
PROJECTS_DELETE_OWN = "projects:delete_own"
PROJECTS_SET_STATUS_OWN = "projects:set_status_own"
APPLICATIONS_SUBMIT = "applications:submit"
APPLICATIONS_WITHDRAW_OWN = "applications:withdraw_own"
APPLICATIONS_LIST_ON_OWN_PROJECT = "applications:list_on_own_project"
APPLICATIONS_DECIDE_ON_OWN_PROJECT = "applications:decide_on_own_project"
NOTIFICATIONS_READ_OWN = "notifications:read_own"
USERS_MANAGE_USER_TYPES = "users:manage_user_types"


USER_TYPE_PERMISSIONS: dict[UserType, set[str]] = {
    UserType.USER: {
        AUTH_LOGIN,
        PROJECTS_LIST_OPEN,
        PROJECTS_VIEW,
        PROFILE_READ_OWN,
        PROFILE_UPDATE_OWN,
        PROJECTS_CREATE,
        PROJECTS_LIST_OWN,
        PROJECTS_LIST_PARTICIPATING,
        PROJECTS_UPDATE_OWN,
        PROJECTS_DELETE_OWN,
        PROJECTS_SET_STATUS_OWN,
        APPLICATIONS_SUBMIT,
        APPLICATIONS_WITHDRAW_OWN,
        APPLICATIONS_LIST_ON_OWN_PROJECT,
        APPLICATIONS_DECIDE_ON_OWN_PROJECT,
        NOTIFICATIONS_READ_OWN,
    },
    UserType.ADMIN: {
        AUTH_LOGIN,
        PROJECTS_LIST_OPEN,
        PROJECTS_VIEW,
        PROFILE_READ_OWN,
        PROFILE_UPDATE_OWN,
        PROJECTS_CREATE,
        PROJECTS_LIST_OWN,
        PROJECTS_LIST_PARTICIPATING,
        PROJECTS_UPDATE_OWN,
        PROJECTS_DELETE_OWN,
        PROJECTS_SET_STATUS_OWN,
        APPLICATIONS_SUBMIT,
        APPLICATIONS_WITHDRAW_OWN,
        APPLICATIONS_LIST_ON_OWN_PROJECT,
        APPLICATIONS_DECIDE_ON_OWN_PROJECT,
        NOTIFICATIONS_READ_OWN,
        USERS_MANAGE_USER_TYPES,
    },
}


def has_permission(user_type: UserType, permission: str) -> bool:
    """Проверяет, есть ли у типа пользователя указанное разрешение."""
    return permission in USER_TYPE_PERMISSIONS.get(user_type, set())
