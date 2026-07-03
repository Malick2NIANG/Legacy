"""add details column to admin_actions

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Branch Labels: None
Depends On: None
"""
from alembic import op
import sqlalchemy as sa

revision = 'c3d4e5f6a7b8'
down_revision = 'b2c3d4e5f6a7'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('admin_actions', sa.Column('details', sa.JSON(), nullable=True))

def downgrade():
    op.drop_column('admin_actions', 'details')
