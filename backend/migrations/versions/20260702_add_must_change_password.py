"""add must_change_password to users

Revision ID: a1b2c3d4e5f6
Revises: fc958c0651e0
Create Date: 2026-07-02
"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = 'fc958c0651e0'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('must_change_password', sa.Boolean(), nullable=True, server_default='false'))


def downgrade():
    op.drop_column('users', 'must_change_password')
