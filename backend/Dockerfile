# Image de base Python slim pour réduire la taille
FROM python:3.11-slim

WORKDIR /app

# Installer les dépendances système nécessaires (psycopg2 + netcat pour le healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Copier et installer les dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir --timeout=1000 -r requirements.txt

# Copier le code source
COPY . .

# Rendre l'entrypoint exécutable
RUN chmod +x entrypoint.sh

# Port d'écoute du serveur FastAPI
EXPOSE 8000

# Entrypoint : migrations + démarrage
ENTRYPOINT ["./entrypoint.sh"]
