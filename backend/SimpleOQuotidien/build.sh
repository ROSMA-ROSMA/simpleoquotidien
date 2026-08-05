#!/usr/bin/env bash
# Render Build Script
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate

# --- Création automatique des comptes initiaux ---
python manage.py shell << 'EOF'
from users.models import Utilisateur

# 1) Superuser (Admin)
if not Utilisateur.objects.filter(email='admin@simpleoquotidien.com').exists():
    admin = Utilisateur.objects.create_superuser(
        email='admin@simpleoquotidien.com',
        password='Admin@2026!',
        first_name='Admin',
        last_name='SOQ',
        role='ADMIN',
        pays='Cameroun',
    )
    admin.is_active = True
    admin.save()
    print('✅ Superuser admin créé')
else:
    print('ℹ️  Superuser admin existe déjà')

# 2) Agent
if not Utilisateur.objects.filter(email='agent@simpleoquotidien.com').exists():
    agent = Utilisateur.objects.create_user(
        email='agent@simpleoquotidien.com',
        password='Agent@2026!',
        first_name='Agent',
        last_name='SOQ',
        role='AGENT',
        pays='Cameroun',
    )
    agent.is_active = True
    agent.save()
    print('✅ Compte agent créé')
else:
    print('ℹ️  Compte agent existe déjà')

EOF
