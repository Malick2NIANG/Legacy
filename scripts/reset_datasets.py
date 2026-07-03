# -*- coding: utf-8 -*-
"""
Reset datasets : supprime tous les datasets existants du compte
et re-uploade tous les fichiers du dossier Datasets test.
"""
import os
import sys
import requests

# Force UTF-8 output sur Windows
sys.stdout.reconfigure(encoding="utf-8")

API = "http://localhost:8000/api/v1"
EMAIL = "nmalick166@gmail.com"
PASSWORD = "Elhadji10@Milo"
DATASETS_DIR = r"C:\Users\HP\Desktop\MGLSI\Projet Tutore\Datasets test"

# ── 1. Login ──────────────────────────────────────────────────────────────────
print("[1/4] Login...")
resp = requests.post(
    f"{API}/auth/login",
    data={"username": EMAIL, "password": PASSWORD},
)
if resp.status_code != 200:
    print(f"  ECHEC login : {resp.status_code} -- {resp.text}")
    sys.exit(1)
token = resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print(f"  OK - Connecte en tant que {EMAIL}")

# ── 2. Recupere tous les datasets ─────────────────────────────────────────────
print("\n[2/4] Recuperation des datasets existants...")
resp = requests.get(f"{API}/datasets/", headers=headers)
if resp.status_code != 200:
    print(f"  ECHEC GET /datasets : {resp.status_code} -- {resp.text}")
    sys.exit(1)
datasets = resp.json()
print(f"  -> {len(datasets)} dataset(s) trouve(s)")

# ── 3. Suppression ────────────────────────────────────────────────────────────
if datasets:
    print("\n[3/4] Suppression...")
    for ds in datasets:
        r = requests.delete(f"{API}/datasets/{ds['id']}", headers=headers)
        ok = "OK" if r.status_code in (200, 204) else f"ECHEC ({r.status_code})"
        print(f"  {ok} - Supprime : {ds['name']} (id={ds['id']})")
else:
    print("\n[3/4] Aucun dataset a supprimer.")

# ── 4. Upload ─────────────────────────────────────────────────────────────────
print("\n[4/4] Upload des datasets...")

# Chemin avec accent
datasets_dir = r"C:\Users\HP\Desktop\MGLSI\Projet Tutoré\Datasets test"
if not os.path.isdir(datasets_dir):
    datasets_dir = DATASETS_DIR

files_in_dir = sorted([
    f for f in os.listdir(datasets_dir)
    if os.path.isfile(os.path.join(datasets_dir, f))
])

if not files_in_dir:
    print(f"  ECHEC : aucun fichier dans {datasets_dir}")
    sys.exit(1)

for filename in files_in_dir:
    filepath = os.path.join(datasets_dir, filename)
    name = os.path.splitext(filename)[0]
    with open(filepath, "rb") as f:
        resp = requests.post(
            f"{API}/datasets/",
            headers=headers,
            data={"name": name},
            files={"file": (filename, f)},
        )
    if resp.status_code in (200, 201):
        ds_id = resp.json().get("id", "?")
        print(f"  OK - {filename} -> id={ds_id}")
    else:
        print(f"  ECHEC - {filename} : {resp.status_code} -- {resp.text[:200]}")

print("\nReset termine.")
