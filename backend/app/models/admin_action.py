"""
Modèle pour les actions admin nécessitant une double approbation.
Utilisé quand le système compte ≥ 2 admins actifs.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class AdminAction(Base):
    __tablename__ = "admin_actions"

    id              = Column(Integer, primary_key=True, index=True)
    action_type     = Column(String, nullable=False)   # promote | demote | delete
    target_user_id  = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    target_email    = Column(String, nullable=True)    # conservé si user supprimé
    target_name     = Column(String, nullable=True)
    requested_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_by_id  = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status          = Column(String, default="pending", nullable=False)  # pending | approved | rejected
    details         = Column(JSON, nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at     = Column(DateTime(timezone=True), nullable=True)
