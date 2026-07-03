"""
Journal d audit, trace toutes les actions effectuees par les admins.
"""
from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id             = Column(Integer, primary_key=True, index=True)
    admin_id       = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    admin_email    = Column(String, nullable=False)   # conserve si admin supprime
    admin_name     = Column(String, nullable=True)
    action_type    = Column(String, nullable=False)   # voir ACTION_LABELS
    target_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    target_email   = Column(String, nullable=True)
    target_name    = Column(String, nullable=True)
    details        = Column(JSON, nullable=True)      # infos supplementaires libres
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
