"""
Service d'authentification.
Encapsule la logique metier de connexion, inscription et verification des credentials.
"""
from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import hash_password, verify_password, create_access_token


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def authenticate(self, email: str, password: str):
        """Verifie les credentials et retourne l'utilisateur ou None."""
        user = self.db.query(User).filter(User.email == email).first()
        if not user or not verify_password(password, user.hashed_password):
            return None
        return user

    def create_user(
        self,
        email: str,
        password: str,
        first_name: str = None,
        last_name: str = None,
        country: str = None,
        gender: str = None,
        age_range: str = None,
        usage_reasons: list = None,
        ml_level: str = None,
        discovery_source: str = None,
        full_name: str = None,
    ) -> User:
        """Cree un nouvel utilisateur avec le mot de passe hashe et son profil demographique."""
        from fastapi import HTTPException, status
        existing = self.db.query(User).filter(User.email == email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Un compte avec cet email existe deja",
            )
        computed_full_name = f"{first_name or ''} {last_name or ''}".strip() or full_name
        user = User(
            email=email,
            hashed_password=hash_password(password),
            full_name=computed_full_name,
            first_name=first_name,
            last_name=last_name,
            country=country,
            gender=gender or "unspecified",
            age_range=age_range,
            usage_reasons=usage_reasons,
            ml_level=ml_level,
            discovery_source=discovery_source,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def create_token(self, user: User) -> str:
        """Cree un JWT pour l'utilisateur."""
        return create_access_token(subject=str(user.id))
