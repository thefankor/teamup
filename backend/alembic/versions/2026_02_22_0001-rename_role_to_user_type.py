"""rename role to user_type

Revision ID: rename_role_user_type
Revises: add_user_role
Create Date: 2026-02-22

"""

from typing import Sequence, Union

from alembic import op

revision: str = "rename_role_user_type"
down_revision: Union[str, Sequence[str], None] = "add_user_role"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "users",
        "role",
        new_column_name="user_type",
    )


def downgrade() -> None:
    op.alter_column(
        "users",
        "user_type",
        new_column_name="role",
    )
