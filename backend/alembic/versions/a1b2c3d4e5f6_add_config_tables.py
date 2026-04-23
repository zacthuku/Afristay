"""add config tables: countries, service_categories, destinations, service_types, rejection_reasons

Revision ID: a1b2c3d4e5f6
Revises: 6b7c8d9e0f1a
Create Date: 2026-04-22 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "8d9e0f1a2b3c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "countries",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(2), unique=True, nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("flag", sa.String(10), nullable=True),
        sa.Column("currency_code", sa.String(10), nullable=False),
        sa.Column("currency_symbol", sa.String(10), nullable=False),
        sa.Column("payment_methods", JSONB(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "service_categories",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.String(50), unique=True, nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("icon", sa.String(10), nullable=True),
        sa.Column("location_keyword", sa.String(100), nullable=True),
        sa.Column("display_bg", sa.String(50), nullable=True),
        sa.Column("display_border", sa.String(50), nullable=True),
        sa.Column("display_text", sa.String(50), nullable=True),
        sa.Column("category_type", sa.String(20), server_default="experience", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "destinations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("slug", sa.String(50), nullable=True),
        sa.Column("subtitle", sa.String(100), nullable=True),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("country_code", sa.String(2), nullable=True),
        sa.Column("is_featured", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "service_types",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.String(50), unique=True, nullable=False),
        sa.Column("label", sa.String(100), nullable=False),
        sa.Column("icon", sa.String(10), nullable=True),
        sa.Column("description", sa.String(200), nullable=True),
        sa.Column("pricing_types", JSONB(), nullable=True),
        sa.Column("category", sa.String(20), server_default="accommodation", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "rejection_reasons",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("text", sa.String(200), nullable=False),
        sa.Column("applies_to", sa.String(20), server_default="both", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )

    op.add_column("services", sa.Column("country_code", sa.String(2), nullable=True))


def downgrade() -> None:
    op.drop_column("services", "country_code")
    op.drop_table("rejection_reasons")
    op.drop_table("service_types")
    op.drop_table("destinations")
    op.drop_table("service_categories")
    op.drop_table("countries")
