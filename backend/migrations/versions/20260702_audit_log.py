"""add audit_logs table

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-07-02
"""
from alembic import op
import sqlalchemy as sa

revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('audit_logs',
        sa.Column('id',             sa.Integer(),  primary_key=True, index=True),
        sa.Column('admin_id',       sa.Integer(),  sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('admin_email',    sa.String(),   nullable=False),
        sa.Column('admin_name',     sa.String(),   nullable=True),
        sa.Column('action_type',    sa.String(),   nullable=False),
        sa.Column('target_user_id', sa.Integer(),  sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('target_email',   sa.String(),   nullable=True),
        sa.Column('target_name',    sa.String(),   nullable=True),
        sa.Column('details',        sa.JSON(),     nullable=True),
        sa.Column('created_at',     sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

def downgrade():
    op.drop_table('audit_logs')
