from src.crud.impl.base import BaseDAO
from src.models import UserEducation


class UserEducationDAO(BaseDAO):
    model = UserEducation
