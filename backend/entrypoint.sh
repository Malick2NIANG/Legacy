#!/bin/sh
# Attendre que PostgreSQL soit prêt, lancer les migrations, puis démarrer le serveur

# En local (Docker), on attend que PostgreSQL soit prêt.
# En production (Supabase/Render), POSTGRES_HOST n'est pas défini → on passe directement.
if [ -n "$POSTGRES_HOST" ]; then
  echo "⏳ Attente de PostgreSQL ($POSTGRES_HOST)..."
  while ! nc -z "$POSTGRES_HOST" 5432; do
    sleep 1
  done
  echo "✅ PostgreSQL prêt."
else
  echo "ℹ️  POSTGRES_HOST non défini — connexion via DATABASE_URL directement."
fi

# Si une commande est passée (ex: celery worker), on l'exécute directement
if [ "$#" -gt 0 ]; then
  echo "🚀 Démarrage : $@"
  exec "$@"
fi

echo "🔄 Lancement des migrations Alembic..."
alembic upgrade head

echo "🚀 Démarrage du worker Celery en arrière-plan..."
celery -A app.workers.celery_app worker --loglevel=info --concurrency=1 &

echo "🚀 Démarrage du serveur FastAPI..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
