"""add destination/purpose/dates to trips table

Revision ID: 8d9e0f1a2b3c
Revises: 7c8d9e0f1a2b
Create Date: 2026-04-21 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "8d9e0f1a2b3c"
down_revision: Union[str, None] = "7c8d9e0f1a2b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("trips", sa.Column("destination", sa.String(), nullable=True))
    op.add_column("trips", sa.Column("purpose", sa.String(), nullable=True))
    op.add_column("trips", sa.Column("check_in", sa.Date(), nullable=True))
    op.add_column("trips", sa.Column("check_out", sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column("trips", "check_out")
    op.drop_column("trips", "check_in")
    op.drop_column("trips", "purpose")
    op.drop_column("trips", "destination")
