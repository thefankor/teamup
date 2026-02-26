"""add user role for RBAC

Revision ID: add_user_role
Revises: fa751eb98a9b
Create Date: 2026-02-22

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "add_user_role"
down_revision: Union[str, Sequence[str], None] = "fa751eb98a9b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("role", sa.String(), server_default="user", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("users", "role")
