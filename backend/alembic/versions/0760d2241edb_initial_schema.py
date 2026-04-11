"""initial_schema

Revision ID: 0760d2241edb
Revises: 
Create Date: 2026-04-09 18:17:25.329136

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import geoalchemy2  # ← fixed: was missing

revision: str = '0760d2241edb'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.create_table('users',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('email', sa.String(), nullable=True),
    sa.Column('phone', sa.String(), nullable=True),
    sa.Column('password_hash', sa.String(), nullable=True),
    sa.Column('google_id', sa.String(), nullable=True),
    sa.Column('auth_provider', sa.String(), nullable=False),
    sa.Column('role', sa.String(), nullable=False),
    sa.Column('is_verified', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('email'),
    sa.UniqueConstraint('google_id'),
    sa.UniqueConstraint('phone')
    )
    op.create_table('services',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('host_id', sa.UUID(), nullable=False),
    sa.Column('type', sa.String(), nullable=False),
    sa.Column('title', sa.String(), nullable=False),
    sa.Column('description', sa.Text(), nullable=False),
    sa.Column('location', geoalchemy2.Geography(geometry_type='POINT', srid=4326, dimension=2, from_text='ST_GeogFromText', name='geography'), nullable=True),
    sa.Column('price_base', sa.Numeric(), nullable=False),
    sa.Column('pricing_type', sa.String(), nullable=False),
    sa.Column('service_metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.CheckConstraint("pricing_type IN ('per_night','per_hour','fixed','per_km')"),
    sa.CheckConstraint("type IN ('accommodation','transport')"),
    sa.ForeignKeyConstraint(['host_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.execute("CREATE INDEX IF NOT EXISTS idx_services_location ON services USING gist (location)")
    op.create_table('trips',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.CheckConstraint("status IN ('planned','booked','cancelled')"),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('accommodations',
    sa.Column('service_id', sa.UUID(), nullable=False),
    sa.Column('rooms', sa.Integer(), nullable=False),
    sa.Column('amenities', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('check_in_time', sa.DateTime(), nullable=False),
    sa.Column('check_out_time', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['service_id'], ['services.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('service_id')
    )
    op.create_table('availability',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('service_id', sa.UUID(), nullable=False),
    sa.Column('start_time', sa.DateTime(), nullable=False),
    sa.Column('end_time', sa.DateTime(), nullable=False),
    sa.Column('is_available', sa.Boolean(), nullable=False),
    sa.ForeignKeyConstraint(['service_id'], ['services.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('bookings',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('service_id', sa.UUID(), nullable=False),
    sa.Column('trip_id', sa.UUID(), nullable=True),
    sa.Column('start_time', sa.DateTime(), nullable=False),
    sa.Column('end_time', sa.DateTime(), nullable=False),
    sa.Column('quantity', sa.Integer(), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('total_price', sa.Numeric(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.CheckConstraint("status IN ('pending','confirmed','cancelled')"),
    sa.ForeignKeyConstraint(['service_id'], ['services.id'], ),
    sa.ForeignKeyConstraint(['trip_id'], ['trips.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('reviews',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('service_id', sa.UUID(), nullable=False),
    sa.Column('rating', sa.Integer(), nullable=False),
    sa.Column('comment', sa.Text(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.CheckConstraint('rating BETWEEN 1 AND 5'),
    sa.ForeignKeyConstraint(['service_id'], ['services.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('transport',
    sa.Column('service_id', sa.UUID(), nullable=False),
    sa.Column('vehicle_type', sa.String(), nullable=False),
    sa.Column('capacity', sa.Integer(), nullable=False),
    sa.Column('pickup_location', geoalchemy2.Geography(geometry_type='POINT', srid=4326, dimension=2, from_text='ST_GeogFromText', name='geography'), nullable=True),
    sa.Column('dropoff_location', geoalchemy2.Geography(geometry_type='POINT', srid=4326, dimension=2, from_text='ST_GeogFromText', name='geography'), nullable=True),
    sa.Column('route', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('price_per_km', sa.Numeric(), nullable=True),
    sa.Column('fixed_price', sa.Numeric(), nullable=True),
    sa.ForeignKeyConstraint(['service_id'], ['services.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('service_id')
    )
    op.execute("CREATE INDEX IF NOT EXISTS idx_transport_dropoff_location ON transport USING gist (dropoff_location)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_transport_pickup_location ON transport USING gist (pickup_location)")
    op.create_table('payments',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('booking_id', sa.UUID(), nullable=False),
    sa.Column('amount', sa.Numeric(), nullable=False),
    sa.Column('method', sa.String(), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('transaction_ref', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.CheckConstraint("method IN ('mpesa','airtel','card')"),
    sa.CheckConstraint("status IN ('pending','completed','failed')"),
    sa.ForeignKeyConstraint(['booking_id'], ['bookings.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('trip_segments',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('trip_id', sa.UUID(), nullable=False),
    sa.Column('origin', sa.String(), nullable=False),
    sa.Column('destination', sa.String(), nullable=False),
    sa.Column('departure_time', sa.DateTime(), nullable=False),
    sa.Column('arrival_time', sa.DateTime(), nullable=False),
    sa.Column('service_id', sa.UUID(), nullable=True),
    sa.Column('booking_id', sa.UUID(), nullable=True),
    sa.Column('order_index', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['booking_id'], ['bookings.id'], ),
    sa.ForeignKeyConstraint(['service_id'], ['services.id'], ),
    sa.ForeignKeyConstraint(['trip_id'], ['trips.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    # ← spatial_ref_sys drop removed


def downgrade() -> None:
    op.drop_table('trip_segments')
    op.drop_table('payments')
    op.execute('DROP INDEX IF EXISTS idx_transport_pickup_location')
    op.execute('DROP INDEX IF EXISTS idx_transport_dropoff_location')
    op.drop_table('transport')
    op.drop_table('reviews')
    op.drop_table('bookings')
    op.drop_table('availability')
    op.drop_table('accommodations')
    op.drop_table('trips')
    op.execute('DROP INDEX IF EXISTS idx_services_location')
    op.drop_table('services')
    op.drop_table('users')
    op.execute("DROP EXTENSION IF EXISTS postgis")  # ← added last