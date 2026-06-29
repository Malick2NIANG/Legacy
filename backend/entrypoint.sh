#!/bin/sh
# Attendre que PostgreSQL soit prêt, lancer les migrations, puis démarrer le serveur

echo "⏳ Attente de PostgreSQL..."
while ! nc -z "$POSTGRES_HOST" 5432; do
  sleep 1
done
echo "✅ PostgreSQL prêt."

# Si une commande est passée (ex: celery worker), on l'exécute directement
# sans relancer les migrations (déjà gérées par le service backend).
if [ "$#" -gt 0 ]; then
  echo "🚀 Démarrage : $@"
  exec "$@"
fi

echo "🔄 Lancement des migrations Alembic..."
alembic upgrade head

echo "🚀 Démarrage du serveur FastAPI..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
