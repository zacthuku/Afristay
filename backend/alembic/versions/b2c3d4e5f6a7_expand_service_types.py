"""expand service types and pricing types to support all tourism categories

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-22 01:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop old CHECK constraints
    op.drop_constraint("services_type_check", "services", type_="check")
    op.drop_constraint("services_pricing_type_check", "services", type_="check")

    # Add expanded CHECK constraints
    op.create_check_constraint(
        "services_type_check",
        "services",
        "type IN ('accommodation','transport','attraction','restaurant','experience','tour','adventure','wellness','event','cruise')",
    )
    op.create_check_constraint(
        "services_pricing_type_check",
        "services",
        "pricing_type IN ('per_night','per_hour','fixed','per_km','per_person','per_day','per_entry')",
    )


def downgrade() -> None:
    op.drop_constraint("services_type_check", "services", type_="check")
    op.drop_constraint("services_pricing_type_check", "services", type_="check")

    op.create_check_constraint(
        "services_type_check",
        "services",
        "type IN ('accommodation','transport')",
    )
    op.create_check_constraint(
        "services_pricing_type_check",
        "services",
        "pricing_type IN ('per_night','per_hour','fixed','per_km')",
    )
