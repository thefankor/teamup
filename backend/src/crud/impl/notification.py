from src.crud.impl.base import BaseDAO
from src.models import Notification


class NotificationDAO(BaseDAO):
    model = Notification
