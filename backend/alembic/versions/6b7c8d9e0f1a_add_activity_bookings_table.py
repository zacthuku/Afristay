"""add activity_bookings table

Revision ID: 6b7c8d9e0f1a
Revises: 5a6b7c8d9e0f
Create Date: 2026-04-20 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "6b7c8d9e0f1a"
down_revision: Union[str, None] = "5a6b7c8d9e0f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "activity_bookings",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("activity_id", sa.String(), nullable=False),
        sa.Column("activity_name", sa.String(), nullable=False),
        sa.Column("activity_location", sa.String(), nullable=False),
        sa.Column("destination", sa.String(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("time", sa.String(), nullable=False),
        sa.Column("participants", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("total_fee", sa.Numeric(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="confirmed"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_activity_bookings_user_id", "activity_bookings", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_activity_bookings_user_id", table_name="activity_bookings")
    op.drop_table("activity_bookings")
