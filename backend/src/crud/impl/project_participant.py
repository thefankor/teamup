from src.crud.impl.base import BaseDAO
from src.models import ProjectParticipant


class ProjectParticipantDAO(BaseDAO):
    model = ProjectParticipant
