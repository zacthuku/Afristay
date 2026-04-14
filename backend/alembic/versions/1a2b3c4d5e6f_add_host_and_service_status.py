"""add_host_and_service_status

Revision ID: 1a2b3c4d5e6f
Revises: 0760d2241edb
Create Date: 2026-04-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '1a2b3c4d5e6f'
down_revision: Union[str, Sequence[str], None] = '408f498944b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('host_application_status', sa.String(), nullable=False, server_default='none'))
    op.add_column('services', sa.Column('approval_status', sa.String(), nullable=False, server_default='pending'))

    op.create_check_constraint(
        'ck_users_host_application_status',
        'users',
        "host_application_status IN ('none','pending','approved','rejected')"
    )
    op.create_check_constraint(
        'ck_services_approval_status',
        'services',
        "approval_status IN ('pending','approved','rejected')"
    )


def downgrade() -> None:
    op.drop_constraint('ck_services_approval_status', 'services', type_='check')
    op.drop_constraint('ck_users_host_application_status', 'users', type_='check')
    op.drop_column('services', 'approval_status')
    op.drop_column('users', 'host_application_status')
