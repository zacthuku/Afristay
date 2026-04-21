"""add payment fields to activity_bookings

Revision ID: 7c8d9e0f1a2b
Revises: 6b7c8d9e0f1a
Create Date: 2026-04-20 01:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "7c8d9e0f1a2b"
down_revision: Union[str, None] = "6b7c8d9e0f1a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("activity_bookings", sa.Column("payment_status", sa.String(), nullable=False, server_default="unpaid"))
    op.add_column("activity_bookings", sa.Column("payment_reference", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("activity_bookings", "payment_reference")
    op.drop_column("activity_bookings", "payment_status")
