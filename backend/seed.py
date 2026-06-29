"""
Script de seed — crée un compte admin et un compte utilisateur standard.
Exécuter depuis le dossier backend/ :  python seed.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User

USERS = [
    {
        "full_name" : "Admin Legacy",
        "email"     : "admin@legacy.com",
        "password"  : "Admin1234!",
        "is_admin"  : True,
    },
    {
        "full_name" : "Utilisateur Test",
        "email"     : "user@legacy.com",
        "password"  : "User1234!",
        "is_admin"  : False,
    },
]

def seed():
    db = SessionLocal()
    created = []
    skipped = []

    for u in USERS:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if existing:
            skipped.append(u["email"])
            continue

        db.add(User(
            full_name       = u["full_name"],
            email           = u["email"],
            hashed_password = hash_password(u["password"]),
            is_admin        = u["is_admin"],
            is_active       = True,
        ))
        created.append(u["email"])

    db.commit()
    db.close()

    if created:
        print("✅ Comptes créés :")
        for e in created:
            u = next(x for x in USERS if x["email"] == e)
            role = "ADMIN" if u["is_admin"] else "USER "
            print(f"   [{role}]  {u['email']}  /  {u['password']}")
    if skipped:
        print("⚠️  Déjà existants (ignorés) :", ", ".join(skipped))

if __name__ == "__main__":
    seed()
